/*
 * Angular 2 decorators and services
 */
import {
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { AppState } from './app.service';
import { OrgUnitService, Constants } from './shared';
import { isNullOrUndefined } from 'util';

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  encapsulation: ViewEncapsulation.None,
  providers: [ OrgUnitService, Constants ],
  styleUrls: [
    './app.component.css'
  ],
  template: `<nav>
      <a [routerLink]=" ['./'] " routerLinkActive="active">
        Data Entry
      </a>
      <a [routerLink]=" ['./listing'] ">
        Orders
      </a>
      <a [routerLink]=" ['./configure'] " *ngIf="isSuperUser">
        Configure
      </a>
      <a [routerLink]=" ['./import'] " *ngIf="isSuperUser">
        Import Tracker Data
      </a>
    </nav>

    <main>
      <router-outlet></router-outlet>
    </main>

    <footer>
      <span></span>
      <div>

      </div>
    </footer>`
})
export class AppComponent implements OnInit {
  isSuperUser = false;

  constructor(
    public appState: AppState,
    private orgUnitService: OrgUnitService,
    private constantService: Constants
  ) {

  }

  public ngOnInit() {
    this.orgUnitService.getUserAuthorities().subscribe((currentUser:any) =>{
      if((!isNullOrUndefined(currentUser)) && (!isNullOrUndefined(currentUser.userCredentials))){
        for(let userRole of currentUser.userCredentials.userRoles){
          if(!isNullOrUndefined(userRole)){
            for(let authority of userRole.authorities){
              if(authority === 'ALL'){
                this.isSuperUser = true;
                return this.isSuperUser;
              }
            }
          }
        }
      }
    });

  }

}
