import { Injectable } from '@angular/core';
import { Route, Router } from '@angular/router';

import { EndpointTypeConfig, initEndpointTypes } from '../../features/endpoints/endpoint-helpers';


export const extensionsActionRouteKey = 'extensionsActionsKey';

export interface EndpointTypeExtension {
  type: string;
  label: string;
  authTypes: string[];
}

export interface StratosExtensionConfig {
  routes?: Route[];
  endpointTypes?: EndpointTypeConfig[];
}

// The different types of Tab
export enum StratosTabType {
  Application = 'appTabs',
  CloudFoundry = 'cfTabs',
  CloudFoundryOrg = 'cfOrgTabs',
  CloudFoundrySpace = 'cfSpaceTabs'
}

export interface StratosTabMetadata {
  type: StratosTabType;
  label: string;
  link: string;
}

// The different types of Action
export enum StratosActionType {
  Applications = 'appsActions',
  Application = 'appActions',
  CloudFoundry = 'cfActions',
  CloudFoundryOrg = 'cfOrgActions',
  CloudFoundrySpace = 'cfSpaceActions',
  Endpoints = 'endpointsActions'
}

export interface StratosActionMetadata {
  type: StratosActionType;
  label?: string;
  link: string;
  icon: string;
  iconFont?: string;
}

export interface StratosEndpointMetadata {
  type: string;
  label: string;
  authTypes: string[];
  icon: string;
  iconFont: string;
}

export type StratosRouteType = StratosTabType | StratosActionType;

// Stores the extension metadata as defined by the decorators
const extensionMetadata = {
  routes: [],
  loginComponent: null,
  extensionRoutes: {},
  tabs: {},
  actions: {},
  endpointTypes: []
};

/**
 * Decortator for a Tab extension
 */
export function StratosTab(props: StratosTabMetadata) {
  return function (target) {
    addExtensionTab(props.type, target, props);
  };
}

/**
 * Decortator for an Action extension
 */
export function StratosAction(props: StratosActionMetadata) {
  return function (target) {
    addExtensionAction(props.type, target, props);
  };
}

/**
 * Decorator for an Extension module providing routes etc.
 */
export function StratosExtension(config: StratosExtensionConfig) {
  return (_target) => {
    if (config.routes) {
      // extensionMetadata.routes is array of route arrays
      extensionMetadata.routes.push(config.routes);
    }
    if (config.endpointTypes) {
      extensionMetadata.endpointTypes.push(...config.endpointTypes);
    }
  };
}

export function StratosLoginComponent() {
  return (target) => {
    extensionMetadata.loginComponent = target;
  };
}

function addExtensionTab(tab: StratosTabType, target: any, props: any) {
  if (!extensionMetadata.tabs[tab]) {
    extensionMetadata.tabs[tab] = [];
  }
  if (!extensionMetadata.extensionRoutes[tab]) {
    extensionMetadata.extensionRoutes[tab] = [];
  }

  extensionMetadata.extensionRoutes[tab].push({
    path: props.link,
    component: target
  });
  extensionMetadata.tabs[tab].push(props);
}

function addExtensionAction(action: StratosActionType, target: any, props: any) {
  if (!extensionMetadata.actions[action]) {
    extensionMetadata.actions[action] = [];
    extensionMetadata.extensionRoutes[action] = [];
  }
  extensionMetadata.extensionRoutes[action].push({
    path: props.link,
    component: target
  });
  extensionMetadata.actions[action].push(props);
}

// Injectable Extension Service
@Injectable()
export class ExtensionService {

  public metadata = extensionMetadata;

  constructor(private router: Router) { }

  /**
   * Initialize the extensions - to be invoked in the AppModule
   */
  public init() {
    this.applyRoutesFromExtensions(this.router);
    this.applyNewEndpointTypes();
  }

  /**
   * Apply route configuration
   */
  private applyRoutesFromExtensions(router: Router) {
    const routeConfig = [...router.config];
    const dashboardRoute = routeConfig.find(r => r.path === '' && !!r.component && r.component.name === 'DashboardBaseComponent');
    let needsReset = false;
    if (dashboardRoute) {
      extensionMetadata.routes.forEach(routes => dashboardRoute.children = dashboardRoute.children.concat(routes));
      needsReset = true;
    }

    if (extensionMetadata.loginComponent) {
      // Override the component used for the login route
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = extensionMetadata.loginComponent;
      needsReset = true;
    }

    if (needsReset) {
      router.resetConfig(routeConfig);
    }
  }

  private applyNewEndpointTypes() {
    initEndpointTypes(this.metadata.endpointTypes);
  }

}

// Helpers to access Extension metadata (without using the injectable Extension Service)

export function getRoutesFromExtensions(routeType: StratosRouteType) {
  return extensionMetadata.extensionRoutes[routeType] || [];
}

export function getTabsFromExtensions(tabType: StratosTabType) {
  return extensionMetadata.tabs[tabType] || [];
}

export function getActionsFromExtensions(actionType: StratosActionType): StratosActionMetadata[] {
  return extensionMetadata.actions[actionType] || [];
}
