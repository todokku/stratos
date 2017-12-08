import { APIResource, NormalizedResponse } from '../types/api.types';
import { Observable } from 'rxjs/Rx';
import {
  CONNECT_CNSIS,
  ConnectCnis,
  DISCONNECT_CNSIS,
  DisconnectCnis,
  EndpointSchema,
  GET_CNSIS,
  GetAllCNSIS,
  GetAllCNSISFailed,
  GetAllCNSISSuccess,
} from './../actions/cnsis.actions';
import { AppState } from './../app-state';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams } from '@angular/http';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';
import { CNSISModel, cnsisStoreNames } from '../types/cnsis.types';
import {
  IAPIAction,
  StartNoneCFAction,
  WrapperNoneCFActionFailed,
  WrapperNoneCFActionSuccess,
} from '../types/request.types';


@Injectable()
export class CNSISEffect {

  static connectingKey = 'connecting';
  static disconnectingKey = 'disconnecting';

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getAllCNSIS$ = this.actions$.ofType<GetAllCNSIS>(GET_CNSIS)
    .flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: cnsisStoreNames.type,
      } as IAPIAction;
      this.store.dispatch(new StartNoneCFAction(apiAction, actionType));
      return Observable.zip(
        this.http.get('/pp/v1/cnsis'),
        this.http.get('/pp/v1/cnsis/registered'),
        (all, registered) => {
          const allCnsis: CNSISModel[] = all.json();
          const registeredCnsis: CNSISModel[] = registered.json();

          return allCnsis.map(c => {
            c.registered = !!registeredCnsis.find(r => r.guid === c.guid);
            return c;
          });
        }
      )
        .mergeMap(data => {
          const mappedData = {
            entities: {
              [cnsisStoreNames.type]: {}
            },
            result: []
          } as NormalizedResponse;

          data.forEach(cnsi => {
            mappedData.entities[cnsisStoreNames.type][cnsi.guid] = cnsi;
            mappedData.result.push(cnsi.guid);
          });
          // Order is important. Need to ensure data is written (none cf action success) before we notify everything is loaded
          // (cnsi success)
          return [
            new WrapperNoneCFActionSuccess(mappedData, apiAction, actionType),
            new GetAllCNSISSuccess(data, action.login),
          ];
        })
        .catch((err, caught) => [
          new WrapperNoneCFActionFailed(err.message, apiAction, actionType),
          new GetAllCNSISFailed(err.message, action.login),
        ]);

    });


  @Effect() connectCnis$ = this.actions$.ofType<ConnectCnis>(CONNECT_CNSIS)
    .flatMap(action => {
      const actionType = 'update';
      const apiAction = {
        entityKey: cnsisStoreNames.type,
        guid: action.guid,
        type: action.type,
        updatingKey: CNSISEffect.connectingKey,
      } as IAPIAction;
      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);
      params.append('username', action.username);
      params.append('password', action.password);

      return this.doCnisAction(
        apiAction,
        '/pp/v1/auth/login/cnsi',
        params
      );
    });

  @Effect() disconnect$ = this.actions$.ofType<DisconnectCnis>(DISCONNECT_CNSIS)
    .flatMap(action => {

      const apiAction = {
        entityKey: cnsisStoreNames.type,
        guid: action.guid,
        type: action.type,
        updatingKey: CNSISEffect.disconnectingKey,
      } as IAPIAction;

      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);

      return this.doCnisAction(
        apiAction,
        '/pp/v1/auth/logout/cnsi',
        params
      );
    });


  private doCnisAction(apiAction: IAPIAction, url: string, params: URLSearchParams) {
    const actionType = 'update';
    const headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    this.store.dispatch(new StartNoneCFAction(apiAction, actionType));
    return this.http.post(url, params, {
      headers
    }).map(endpoint => {
      return new WrapperNoneCFActionSuccess(null, apiAction, 'update');
    })
      .catch(e => {
        return [new WrapperNoneCFActionFailed('Could not connect', apiAction, 'update')];
      });
  }
}
