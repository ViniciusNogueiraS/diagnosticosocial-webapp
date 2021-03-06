import { Component, OnInit } from '@angular/core';
import { Listagem } from '@app/shared/listagem';
import { Evento } from '@app/evento/evento';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from '@app/shared/modal/modal.service';
import { EventoService } from '@app/evento/evento.service';
import { finalize } from 'rxjs/operators';
import * as _ from 'lodash';
import { AnimationHelper } from '@app/shared/helpers/animation-helper';
import { EventoEspecificoHelper } from '../evento-especifico/evento-especifico.helper';
import { Router } from '@angular/router';

const ID_MODAL_EXCLUSAO = '#ds-evento-modal-exclusao';
const ID_MODAL_MOCK = '#ds-evento-modal-gerar-mock';
const ID_TABLE = '#ds-evento-table';

@Component({
  selector: 'app-evento-listagem',
  templateUrl: './evento-listagem.component.html',
  styleUrls: ['./evento-listagem.component.scss']
})
export class EventoListagemComponent implements OnInit {

  public listagem: Listagem<Evento>;
  public carregando: boolean;
  public erroListagem: boolean;
  public salvando: boolean;
  public eventoExclusao: Evento;
  public gerandoMock: boolean;

  constructor(
    private _eventoService: EventoService,
    private _toastrService: ToastrService,
    private _router: Router,
    private _EventoEspecificoHelper: EventoEspecificoHelper,
    private _modalService: ModalService) {
  }

  ngOnInit() {
    this.listagem = new Listagem<Evento>();

    this.obterListagem();
  }

  obterListagem(refresh: boolean = false) {
    if (refresh) {
      this.listagem.pagina = 1;
    }
    else {
      this.listagem.pagina++;
    }

    this.carregando = true;
    this._eventoService.obterPorPagina(this.listagem.pagina)
    .pipe(finalize(() =>
      this.carregando = false
    ))
    .subscribe((listagem: Listagem<Evento>) =>
      refresh ? this.listagem.atualizar(listagem) : this.listagem.incrementar(listagem),
      () => this.erroListagem = true
    );
  }

  confirmarExclusao(obj: Evento) {
    this.eventoExclusao = obj;
    this._modalService.open(ID_MODAL_EXCLUSAO);
  }

  excluir() {
    this.salvando = true;
    this._eventoService.excluir(this.eventoExclusao.id)
    .then(() => {
      _.remove(this.listagem.conteudo, (obj) => {
        return obj.id === this.eventoExclusao.id;
      });
      this.listagem.total--;
      this._toastrService.success('Evento removido com sucesso.', 'Ok');
      this.salvando = false;
      this._modalService.close(ID_MODAL_EXCLUSAO);
    })
    .catch(({error}) => {
      this._toastrService.error(error, 'Ops!');
      this.salvando = false;
    });
  }

  novo() {
    this._EventoEspecificoHelper.abrir({
      evento: new Evento()
    });
  }

  visualizar(evento: Evento) {
    this._EventoEspecificoHelper.abrir({
      evento: evento
    });
  }

  diagnostico(evento: Evento) {
    this._router.navigate([`/eventos/${evento.id}/diagnostico`]);
  }

  eventoConcluido(obj: Evento) {
    let eventoListagem = this.listagem.conteudo.find((p) => p.id === obj.id);

    if (!!eventoListagem) {
      eventoListagem.nome = obj.nome;
    }
    else {
      this.listagem.conteudo.unshift(obj);
      this.listagem.total++;
      AnimationHelper.table.splashNew(ID_TABLE);
    }
  }

  preencherMock(obj: Evento) {
    this.eventoExclusao = obj;
    this._modalService.open(ID_MODAL_MOCK);
  }

  gerarEntrevistas() {
    this.gerandoMock = true;
    this._eventoService.preencherMock(this.eventoExclusao.id)
    .pipe(finalize(() => this.gerandoMock = false))
    .subscribe(() =>
      {
        this.eventoExclusao = undefined;
        this._modalService.close(ID_MODAL_MOCK);
        this._toastrService.success('Entrevistas geradas.', 'OK');
      },
      () => this._toastrService.error('Falha ao gerar dados fictícios.')
    );
  }
}
