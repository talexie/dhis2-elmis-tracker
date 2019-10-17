import { Component, OnInit, ViewEncapsulation,ValueProvider,ViewChild,ApplicationRef,Input,Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Logger } from '../logger.service';
import { Subscription } from 'rxjs';
import { Constants } from '../shared/constants';
import { OrgUnitService, DataSetService, NotifyService, ProgramService } from '../shared';
import { TreeNode, TREE_ACTIONS, IActionMapping, TreeComponent } from 'angular-tree-component';
import { forEach } from '@angular/router/src/utils/collection';
import { isUndefined,isNullOrUndefined } from 'util';
import { initDomAdapter } from '@angular/platform-browser/src/browser';
import * as moment from 'moment';
import * as safeEval from 'safe-eval';
@Component({
    selector: 'tracker-listing',
    styleUrls: [],
    templateUrl: './trackerlisting.component.html',
    encapsulation: ViewEncapsulation.None,
    providers: [ ProgramService, Logger,OrgUnitService, NotifyService, DataSetService ]
})
export class TrackerListingComponent implements OnInit {
	constructor(

    	private prog: ProgramService,
    	private logger: Logger,
    	private route: ActivatedRoute,
	    private constant: Constants,
	    private orgunitService: OrgUnitService,
	    private notify: NotifyService,
	    private dataSetService: DataSetService,

      ){

	}
	ngOnInit(){

	}


}
