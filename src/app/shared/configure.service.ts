import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { Observable, Subscription } from "rxjs";
import { isUndefined,isNull,isArray} from 'util';

import { NotifyService, Constants } from '.';
/**
 * Created by Alex Tumwesigye, Feb 2017.
 */
@Injectable()
export class ConfigureService {

    private DHIS2URL: string;

    constructor(
      	private notify: NotifyService,
      	private constant: Constants,
      	private http: HttpClient
      ){
    	this.DHIS2URL = this.constant.ROOTURL;  // URL to web API
    }

    /** Get programs with LMIS attribute set
    **/
    getProgramsByAttribute(attribute){

    }

    /** Get TrackedEntityAttributes  by program
    **/

    getTrackedEntityAttributesByProgram(program){

    }

    /** Get OptionSets for Cycles by LMIS attribute and Warehouse Option Code
    **/
    getCyclesByAttributeAndWarehouse(attribute,warehouse){

    }

    /**
    Get OptionSets for Warehouse by LMIS attribute
    Select the warehouse optionSets from the optionSets list with LMIS attribute set.
    **/
    getOptionSetsByAttribute(attribute){

    }


}
