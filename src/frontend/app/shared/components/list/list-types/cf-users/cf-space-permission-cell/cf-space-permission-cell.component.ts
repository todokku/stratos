import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { arrayHelper } from '../../../../../../core/helper-classes/array.helper';
import { getSpaceRoles, SpaceUserRoleNames } from '../../../../../../features/cloud-foundry/cf.helpers';
import { RemoveUserPermission } from '../../../../../../store/actions/users.actions';
import { AppState } from '../../../../../../store/app-state';
import { cfUserSchemaKey, entityFactory } from '../../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUser, IUserPermissionInSpace } from '../../../../../../store/types/user.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { EntityMonitor } from '../../../../../monitors/entity-monitor';
import { CfPermissionCell, ICellPermissionList } from '../cf-permission-cell';

@Component({
  selector: 'app-cf-space-permission-cell',
  templateUrl: './cf-space-permission-cell.component.html',
  styleUrls: ['./cf-space-permission-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CfSpacePermissionCellComponent extends CfPermissionCell<SpaceUserRoleNames> {

  constructor(
    public store: Store<AppState>,
    public cfUserService: CfUserService
  ) {
    super();
  }

  protected setChipConfig(row: APIResource<CfUser>) {
    const userRoles = this.cfUserService.getSpaceRolesFromUser(row.entity);
    const userPermInfo = arrayHelper.flatten<ICellPermissionList<SpaceUserRoleNames>>(
      userRoles.map(spacePerms => this.getSpacePermissions(spacePerms, row))
    );
    this.chipsConfig = this.getChipConfig(userPermInfo);
  }

  private getSpacePermissions(spacePerms: IUserPermissionInSpace, row: APIResource<CfUser>) {
    return getSpaceRoles(spacePerms.permissions).map(perm => {
      const updatingKey = RemoveUserPermission.generateUpdatingKey<SpaceUserRoleNames>(
        spacePerms.orgGuid,
        perm.key,
        row.metadata.guid
      );
      return {
        ...perm,
        name: spacePerms.name,
        spaceId: spacePerms.orgGuid,
        busy: new EntityMonitor(
          this.store,
          row.metadata.guid,
          cfUserSchemaKey,
          entityFactory(cfUserSchemaKey)
        ).getUpdatingSection(updatingKey).pipe(
          map(update => update.busy)
        )
      };
    });
  }

  public removePermission(cellPermission: ICellPermissionList<SpaceUserRoleNames>) {
    console.log('NOT IMPLEMENTED');
  }
}
