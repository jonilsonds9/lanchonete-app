import { Situacao } from '../../domain/model/situacao';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemPedidoEntity } from './item-pedido.entity';
import { ClienteEntity } from './cliente.entity';

@Entity({ name: 'pedidos' })
export class PedidoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigoPedido: number;

  @ManyToOne(() => ClienteEntity, { nullable: true, onUpdate: 'RESTRICT' })
  cliente: ClienteEntity;

  @OneToMany(() => ItemPedidoEntity, (item) => item.pedido, { cascade: true })
  itensPedido: Array<ItemPedidoEntity>;

  @Column()
  precoTotal: number;

  @Column({
    type: 'enum',
    enum: Situacao,
    default: Situacao.RECEBIDO,
  })
  situacao: Situacao;

  @CreateDateColumn()
  dataHoraCadastro: Date;

  constructor(
    codigoPedido: number,
    cliente: ClienteEntity,
    itensPedido: Array<ItemPedidoEntity>,
    precoTotal: number,
  ) {
    this.codigoPedido = codigoPedido;
    this.cliente = cliente;
    this.itensPedido = itensPedido;
    this.precoTotal = precoTotal;
  }
}
