import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllOrgUsers } from '../actions/organization.actions';
import { GetAllSpaceUsers } from '../actions/space.actions';
import { GetAllUsersAsAdmin, GetUser } from '../actions/users.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface UserActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid,
    endpointGuid
  ) => GetUser;
  // Must be admin user for this to succeed.
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetAllUsersAsAdmin;
  getAllInOrganization: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => GetAllOrgUsers;
  getAllInSpace: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => GetAllSpaceUsers;
}

export const userActionBuilders: UserActionBuilder = {
  get: (
    guid,
    endpointGuid
  ) => new GetUser(endpointGuid, guid),
  // Must be admin user for this to succeed.
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllUsersAsAdmin(endpointGuid, includeRelations, populateMissing, paginationKey),
  getAllInOrganization: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => new GetAllOrgUsers(guid, paginationKey, endpointGuid, isAdmin, includeRelations),
  getAllInSpace: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => new GetAllSpaceUsers(guid, paginationKey, endpointGuid, isAdmin, includeRelations),
};
