import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse,HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import { isUndefined,isNull,isArray,isNullOrUndefined} from 'util';
import { filter } from "rxjs/operators";

import { NotifyService, Constants } from '.';
/**
 * Created by Alex Tumwesigye, Feb 2017.
 */
@Injectable()
export class DataStoreService {
    private DHIS2URL: string;

    constructor(
      private notify: NotifyService,
      private constant: Constants,
      private http: HttpClient
      ){
    	this.DHIS2URL = this.constant.ROOTURL;  // URL to web API
    }

    /**
    Get dataStore by search key
    **/
    getDataStoreByKey(dataStore,dataStoreKey){
	    if((!isUndefined(dataStore)) && (!isUndefined(dataStoreKey))){
		    return this.http.get(this.DHIS2URL + 'api/dataStore/' + dataStore + '/' + dataStoreKey + '.json?paging=false');
		}
	}
	 /**
	 Get dataStore
	 **/
    getDataStore(dataStore){
	    if(!isUndefined(dataStore)){
		    return this.http.get(this.DHIS2URL + 'api/dataStore/' + dataStore + '.json?paging=false');
		}
	}
	/**
	 save key to dataStore
	 **/
	postDataStore(dataStore,dataStoreKey,dataStoreValues) {
	    let headers: any = new HttpHeaders({ 'Content-Type': 'application/json' });
	    return this.http.post(this.DHIS2URL + 'api/dataStore/' + dataStore + '/' + dataStoreKey, dataStoreValues, headers);
	}

	/**
	 Update key to dataStore
	 **/
	updateDataStore(dataStore,dataStoreKey,dataStoreValues) {
	    let headers: any = new HttpHeaders({ 'Content-Type': 'application/json' });
	    return this.http.put(this.DHIS2URL + 'api/dataStore/' + dataStore + '/' + dataStoreKey, dataStoreValues, headers);
	}
	/**
	 Delete key to dataStore
	 **/
	deleteDataStoreKey(dataStore,dataStoreKey) {
	    return this.http.delete(this.DHIS2URL + 'api/dataStore/' + dataStore + '/' + dataStoreKey);
	}
	/** Get DataStore by NameSpace
	**/
	getDataStoreNameSpace(dataStores,namespace){

	}
  /**
  Get order Types for warehouses, zones and cycles
  **/
  getOrderTypes(orderType:any,orderTypes:any){
    let orderTypeSelected : any = [];
    if((!isNullOrUndefined(orderType)) && (!isNullOrUndefined(orderTypes))){
      orderTypeSelected = orderTypes.filter(order =>{
        return (order.id === orderType.id);
      });

    }
    return orderTypeSelected;
  }

}
