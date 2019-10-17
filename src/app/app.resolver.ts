import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { DataSetService,OrgUnitService,DataStoreService,ProgramService } from './shared';

@Injectable()
export class DataResolver implements Resolve<any> {
  	constructor(private programService: ProgramService){

  	}
  	//prog: ProgramService;

	public resolve(route: ActivatedRouteSnapshot):Observable<any>|Promise<any>| any {
	    return this.programService.getPrograms();
	    //return Observable.of('This is resolved');
	}
}

@Injectable()
export class SystemUidResolver implements Resolve<any> {
  	constructor(private programService: ProgramService){

  	}
	public resolve(route: ActivatedRouteSnapshot):Observable<any>|Promise<any>| any {
	    return this.programService.getSystemUids(50);
	    //return Observable.of('This is resolved');
	}
}
@Injectable()
export class DataStoreResolver implements Resolve<any> {
  	constructor(private dataStoreService: DataStoreService){

    }
    public resolve(route: ActivatedRouteSnapshot):Observable<any>|Promise<any>| any {
	    return this.dataStoreService.getDataStoreByKey('ugx_elmis','config');
	}

}
@Injectable()
export class DataSetResolver implements Resolve<any> {
  	constructor(private dataSetService: DataSetService){

    }
    public resolve(route: ActivatedRouteSnapshot):Observable<any>|Promise<any>| any {

	     return this.dataSetService.getDataSets();
	}

}
@Injectable()
export class OptionSetResolver implements Resolve<any> {
  	constructor(private dataSetService : DataSetService){

  	}
	public resolve(route: ActivatedRouteSnapshot):Observable<any>|Promise<any>| any {
	    return this.dataSetService.getOptionSets();
	    //return Observable.of('This is resolved');
	}
}
@Injectable()
export class CurrentUserResolver implements Resolve<any> {
  	constructor(private orgUnitService : OrgUnitService){

  	}
	public resolve(route: ActivatedRouteSnapshot):Observable<any>|Promise<any>| any {
	    return this.orgUnitService.getUserAuthorities();
	}
}

// an array of services to resolve routes with data
export const APP_RESOLVER_PROVIDERS = [
  DataResolver, SystemUidResolver, DataStoreResolver, DataSetResolver, OptionSetResolver, CurrentUserResolver
];
