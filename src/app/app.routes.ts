import { Routes } from '@angular/router';
import { ConfigureComponent,FileUploadComponent,TrackerFormComponent, TrackerListingComponent } from './configure';
import { NoContentComponent } from './no-content';

import { DataResolver, SystemUidResolver,DataSetResolver,OptionSetResolver, DataStoreResolver } from './app.resolver';

export const ROUTES: Routes = [
  { path: '', component: TrackerFormComponent,
    resolve: {
          lmisConfig: DataStoreResolver,
          programs: DataResolver,
          uids: SystemUidResolver,
          datasets: DataSetResolver,
          optionSet: OptionSetResolver

      }
  },
  {
    path: "configure",
    component: ConfigureComponent,
    resolve: {
        datasets: DataSetResolver,
        optionSet: OptionSetResolver
    }
  },
  { path: 'import',  component: FileUploadComponent },
  { path: 'listing',  component: TrackerListingComponent },
  /*{
  	path: 'configure',
  	component: ConfigureComponent,
  	resolve: {
  		programs: DataResolver
  	}
  },*/
  //{ path: 'about', component: AboutComponent },
  { path: '**',    component: NoContentComponent },
];
