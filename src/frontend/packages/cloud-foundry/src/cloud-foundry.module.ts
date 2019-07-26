import { NgModule } from '@angular/core';

import { registerCFEntities } from './cf-entity-generator';
import { CloudFoundryComponentsModule } from './shared/components/components.module';

registerCFEntities();

@NgModule({
  imports: [
    // TODO: NJ split out anything lazy loaded into seperate module
    CloudFoundryComponentsModule,
    // FIXME: STRAT-155 - Move cf effects into cf module
    // EffectsModule.forRoot([
    //   PermissionsEffects,
    //   PermissionEffects
    // ])
  ],
})
export class CloudFoundryPackageModule { }