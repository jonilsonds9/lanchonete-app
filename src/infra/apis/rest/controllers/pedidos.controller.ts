import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PedidoPresenter } from '../presenters/pedido.presenter';
import { PedidoDto } from '../dtos/pedido.dto';
import { UseCaseProxy } from '../../../usecases-proxy/use-case-proxy';
import { PedidoUseCases } from '../../../../usecases/pedido.use.cases';
import { UseCasesProxyModule } from '../../../usecases-proxy/use-cases-proxy.module';
import { ProdutosUseCases } from '../../../../usecases/produtos.use.cases';
import { Produto } from '../../../../domain/model/produto';
import { ItemPedido } from '../../../../domain/model/item-pedido';
import { Pedido } from '../../../../domain/model/pedido';
import { ClienteUseCases } from '../../../../usecases/cliente.use.cases';
import { CheckoutUseCases } from '../../../../usecases/checkout.use.cases';

@ApiTags('Pedidos')
@ApiResponse({ status: '5XX', description: 'Erro interno do sistema' })
@Controller('/api/pedidos')
export class PedidosController {
  constructor(
    @Inject(UseCasesProxyModule.PEDIDO_USECASES_PROXY)
    private pedidoUseCasesUseCaseProxy: UseCaseProxy<PedidoUseCases>,
    @Inject(UseCasesProxyModule.PRODUTO_USECASES_PROXY)
    private produtosUseCasesUseCaseProxy: UseCaseProxy<ProdutosUseCases>,
    @Inject(UseCasesProxyModule.CLIENTE_USECASES_PROXY)
    private clienteUseCasesUseCaseProxy: UseCaseProxy<ClienteUseCases>,
    @Inject(UseCasesProxyModule.CHECKOUT_USECASES_PROXY)
    private checkoutUseCasesUseCaseProxy: UseCaseProxy<CheckoutUseCases>,
  ) {}

  @ApiOperation({
    summary: 'Listagem de pedidos cadastrados',
    description: 'Retorna a lista de pedidos cadastrados no sistema',
  })
  @ApiOkResponse({
    isArray: true,
    type: PedidoPresenter,
  })
  @Get()
  async listar(): Promise<Array<PedidoPresenter>> {
    const allPedidos = await this.pedidoUseCasesUseCaseProxy
      .getInstance()
      .getAllPedidos();
    return allPedidos.map((pedido) => new PedidoPresenter(pedido));
  }

  @ApiOperation({
    summary: 'Cria um novo pedido',
    description:
      'Faz o cadastro de uma novo pedido e retorna o pedido em caso de sucesso',
  })
  @ApiOkResponse({
    type: PedidoPresenter,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou incorretos',
  })
  @Post()
  async incluir(@Body() pedidoDto: PedidoDto): Promise<PedidoPresenter> {
    let cliente = null;
    if (pedidoDto.clienteInformouCpf()) {
      cliente = await this.clienteUseCasesUseCaseProxy
        .getInstance()
        .getClienteByCpf(pedidoDto.clienteCpf);
      if (cliente === null)
        throw new NotFoundException('Cliente não encontrado');
    }

    const items = await Promise.all(
      pedidoDto.itensPedido.map(async (item) => {
        const produto: Produto = await this.produtosUseCasesUseCaseProxy
          .getInstance()
          .getProdutoById(item.produtoId);
        return new ItemPedido(produto, item.quantidade);
      }),
    );

    const nextCodigo = await this.pedidoUseCasesUseCaseProxy
      .getInstance()
      .getNextCodigo();

    const novoPedido = new Pedido(nextCodigo, cliente, items);

    await this.checkoutUseCasesUseCaseProxy
      .getInstance()
      .makePagamento(novoPedido);

    const pedido = await this.pedidoUseCasesUseCaseProxy
      .getInstance()
      .addPedido(novoPedido);

    return new PedidoPresenter(pedido);
  }
}
