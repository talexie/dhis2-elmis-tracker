import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TreeModule } from 'angular-tree-component';
import { HttpModule } from '@angular/http';
import { NgModule,ApplicationRef } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AgmCoreModule } from '@agm/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { DynamicFormsCoreModule } from '@ng-dynamic-forms/core';
import { DynamicFormsNGBootstrapUIModule } from '@ng-dynamic-forms/ui-ng-bootstrap';
import {
  RouterModule,
  PreloadAllModules
} from '@angular/router';

/** D2 Library **/

import log from 'loglevel';
/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';
// App is our top level component
import { AppComponent } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';
import { HomeComponent } from './home';
import { ConfigureComponent, FileUploadComponent,TrackerFormComponent, TrackerListingComponent  } from './configure';
import { NoContentComponent } from './no-content';
import { XLargeDirective } from './home/x-large';
import { Logger } from './logger.service';
import { DataResolver, DataSetResolver,DataStoreResolver,OptionSetResolver } from './app.resolver';
import { Constants, NotifyService, OrgUnitService, DataSetService, DataStoreService, ProgramService } from './shared';


// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-5/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
// Application wide providers

const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState, Logger, ProgramService, Constants,DataSetService, NotifyService, DataStoreService,OrgUnitService
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [
    AppComponent,
    HomeComponent,
    ConfigureComponent,
    TrackerFormComponent,
    TrackerListingComponent,
    FileUploadComponent,
    NoContentComponent,
    XLargeDirective
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpModule,
    NgSelectModule,
    ReactiveFormsModule,
    RouterModule.forRoot(ROUTES, { useHash: true, preloadingStrategy: PreloadAllModules }),
    TreeModule,
    HttpClientModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient]
        }
    }),
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCejKSbm1jGgmj48sbg8fG4jiu8upDyALA'
    }),
    NgbModule.forRoot(),
    NgxDatatableModule,
    DynamicFormsCoreModule.forRoot(),
    DynamicFormsNGBootstrapUIModule,

  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS
  ]
})
export class AppModule {

  constructor(
    public appRef: ApplicationRef,
    public appState: AppState
  ) {}

}
