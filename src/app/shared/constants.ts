import { Injectable } from '@angular/core';
import {HttpClient, HttpResponse} from "@angular/common/http";
import {Observable, Subscription} from "rxjs";
/**
 * Created by kelvin on 9/19/16.
 */
@Injectable()
export class Constants {
    ROOTURL: string = null;

    constructor( private http: HttpClient ){
      this.ROOTURL = '../../../';
    }

  load() {
    return this.http.get("manifest.webapp");
  }

  private handleError (error: any) {
    // In a real world app, we might use a remote logging infrastructure
    let errMsg: string;
    console.error(errMsg);
    return Observable.throw(errMsg);
  }
   // Get system information
  getSystemInfo() {
    return this.http.get(this.ROOTURL + 'api/system/info.json');
  }

}
