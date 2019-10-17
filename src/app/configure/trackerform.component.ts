import { Component, OnInit, ViewEncapsulation,ValueProvider,ViewChild,ApplicationRef,Input,Output, Renderer,
  ElementRef } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { FormGroup, FormControl,NgForm,NgModel, FormArray, FormBuilder,Validators } from '@angular/forms';
import { TRACKER_FORM_MODEL } from './models/trackerentry.model';
import {
	DynamicFormControlModel,
  DynamicFormGroupModel,
	DynamicFormService,
  DynamicCheckboxModel,
  DynamicInputModel,
  DynamicFormArrayModel,
  DynamicDatePickerModel,
  DynamicSelectModel
} from '@ng-dynamic-forms/core';

import { Observable } from 'rxjs/Observable';
import { Logger } from '../logger.service';
import { Subscription } from 'rxjs';
import { Constants } from '../shared/constants';
import { OrgUnitService, DataSetService, NotifyService,ProgramService,DataStoreService } from '../shared';
import { TreeNode, TREE_ACTIONS, IActionMapping, TreeComponent,ITreeOptions } from 'angular-tree-component';
import { forEach } from '@angular/router/src/utils/collection';
import { isUndefined,isNullOrUndefined } from 'util';
import { initDomAdapter } from '@angular/platform-browser/src/browser';

import * as moment from 'moment';
import * as safeEval from 'safe-eval';

const actionMapping:IActionMapping = {
  mouse: {
    click: (node, tree, $event) => {
      $event.shiftKey
        ? TREE_ACTIONS.TOGGLE_ACTIVE_MULTI(node, tree, $event)
        : TREE_ACTIONS.TOGGLE_SELECTED(node, tree, $event)
    }
  }
};

const WINDOW_PROVIDER: ValueProvider = {
  provide: Window,
  useValue: window
};

@Component({
    selector: 'tracker-dynamic-form',
    styleUrls: [],
    templateUrl: './trackerform.component.html',
    encapsulation: ViewEncapsulation.None,
    providers: [ ProgramService, Logger,OrgUnitService, NotifyService, DataSetService, DataStoreService ]
})
export class TrackerFormComponent implements OnInit {
    /** Dynamic form creation **/
    orderForm: FormGroup = new FormGroup({});
    formModel: DynamicFormControlModel[] = [];
    private trackerEntryFormGroup: FormGroup = new FormGroup({});
    entityForm: FormGroup = new FormGroup({});
    entityAttributeForm: FormGroup = new FormGroup({});

    checkboxControl: FormControl;
    checkboxModel: DynamicCheckboxModel;

    arrayControl: FormArray;
    arrayModel: DynamicFormArrayModel;
    DHIS2_VERSION: number = 25;
    private _programsMetaData: any = [];
    private idnames = [];
    private dataElements: any = [];
    private program: any = {};
    private programStage: any = [];
    private programAttributes: any = [];
    private trackerFields:Array<DynamicFormControlModel>  = [];
    programData: any;
    source: any;
    trackerFieldsLength: number = 0;


    private subscription: Subscription;
    sectionColumnTotals:any = {};
    orgUnit: any = {};
    orgunits: any[] = [];
    loading: boolean = true;
    treeOrgunits: any[] = [];
    orgunitLevels: any = 1;
    DHIS2URL: string;
    orgunitTreeConfig: any = {
        showSearch : true,
        searchText : 'Search',
        level: null,
        loading: false,
        loadingMessage: 'Loading Organisation units...',
        multiple: true,
        placeholder: "Select Organisation Unit"
    };
    organisationunits: any[] = [];
    selectedOrgUnits: any[] = [];
    defaultOrgUnit: string[] = [];
    showOrgTree:boolean = true;
    showAdditionalOptions:boolean = true;
    showMenu:boolean = true;
    hideMenu:boolean = false;
    showDetails:boolean = false;

    @ViewChild('orgtree')
    orgtree: TreeComponent;
    @ViewChild('programTree')
    programTree: TreeComponent;

    orgUnitLength:number = 0;
    orgunitForModel:any = [];
    metadataReady = false;
    haveAuthorities:boolean = false;

    stageDataElementsLoaded: boolean = false;
    stageFormSubmitted: boolean = false;
    trackedEntitySubmitted: boolean = false;
    stageFormOpen: boolean = false;
    /** Set settings for table layout
     **/
    settings = {};
    tableListData: any = [];
    listData: any = [];
    eventsData: any = [];
    // custom settings for tree
    treeOptions: ITreeOptions = {
        isExpandedField: 'expanded',
        actionMapping:{},
        useVirtualScroll: true
    };
    // Program Tree
    private programsTree:  any[] = [];
    private selectedProgram: any[] = [];
    private programTreeObject: any = {};
    private orgUnitPrograms: any = [];
    private uids:any = [];
    private noProgramDataMessage: string = '';
    private programAssigned: boolean = false;
    programActivated: boolean = false;
    private cyclesEnabled = true;
    private cycles:  any = [];
    private orderTypes:  any = [];
    private orderType:any = {};
    private programUniqueIdentifier: any = {};
    private programCycleIdentifier: any = {};
    private payload: any = [];
    private orgUnitAncestors: any = [];
    private orgUnitGroups: any = [];
    private generatedValue: any;
    private orderAvailable: boolean = false;
    private periodId: string;
    private periodName: string;
    //Date handlers
    selDate: any;
    public notifyOptions = {};

    // Dynamic form for DataSets

      private dataSetElements: any = [];
      private dynamicColumns: any =[];
      entityDataEntryForm: FormGroup = new FormGroup({});
      dataSetForm: FormGroup = new FormGroup({});
      dataSets: any = [];
      dataSetsEnabled: any = [];
      private lmisOptionSets: any;
      private selectedDueDate: any;
      private programDeliveryZoneAttr: any = "";
      private programWarehouseAttr: any = "";
      private programOrderTypeAttr: any = "";
      private zones:any = [];
      private warehouses: any = [];
      private zone:any = {};
      private warehouse: any = {};
      private originalWarehouse: any = {};
      private enabledDataSets: any = [];
      private dataEntryControl: FormArray;
      dataEntryFormLoaded: boolean = false;
      dataSetLoaded: string = "";
      private categoryCombos: any = [];
      private isReadOnly: boolean = false;
      private isHidden: boolean = false;
      private prevSelectedDataSetId: any = "";
      private uniqueNumberGenerated: boolean = false;
      private dataElementToUpdate:any = {};
      private currentDataElementToUpdate:any = {};
      @Input() public optionsSearched:any = [];
      private stageDataElements: any = [];
      private programStageDataElements: any = [];
      private stageDataElementsMetaData: any = {};
      private dataSetAttributes:any = [];
      private dataSetAttributesLength:number = 0;
      private dataSetAttributesAvailable: boolean = false;
      formStayClosed: boolean = true;
      private checkListDataElementId:string = '';
      private elmisConfig: any;
      private products:FormArray;
      private items:any = [];
      private orderIds: any = {}; 
      private orderProducts: any = [];
      private orderCodes: any = [];
      private orderPackage: any = [];

    constructor(

    	private prog: ProgramService,
    	private logger: Logger,
    	private formService: DynamicFormService,
      private route: ActivatedRoute,
      private constant: Constants,
      private orgunitService: OrgUnitService,
      private fb: FormBuilder,
      private notify: NotifyService,
      private dataSetService: DataSetService,
      private dataStoreService: DataStoreService,
      private _router: Router,
      private dynamicFormService: DynamicFormService

      ){
    	  route.data.subscribe(programs => {
          this.programData = programs
        });
        //route.data.subscribe(uids => { this.uids = uids });
        this.uids = route.snapshot.data['uids'];
        this.DHIS2URL = this.constant.ROOTURL;
        /** Notifications **/
        this.notifyOptions = this.notify.options;
        this.dataSets = route.snapshot.data['datasets'];
        this.lmisOptionSets = route.snapshot.data['optionSet'];
        this.elmisConfig = route.snapshot.data['lmisConfig'];

    }

    ngOnInit() {

    	this.source = [];
    	this._programsMetaData = this.programData.programs.programs;
      this.dataSetsEnabled = this.dataSets.dataSets;
      this.orderIds = this.elmisConfig.orderElementIds;

      this.items = this.prog.createProducts(this.items,this.orderIds);
      this.items = [...this.items];
      this.orderForm = this.fb.group({
        products: this.fb.array([])
      });
      this.entityDataEntryForm = this.fb.group({
        dataElements: new FormArray([])
      });
      this.dataSetForm = this.fb.group({
        selectedOrgUnitId: new FormControl({value:'',disabled:false}, Validators.required),
        selectedDataSetId: new FormControl({value:'',disabled:false}, Validators.required),
        selectedPeriodId: new FormControl({value:'',disabled:false}, Validators.required),
      });

      this.stageFormSubmitted = false;
      this.stageDataElementsLoaded = false;
      this.stageFormOpen = false;

      //loading organisation units

      this.orgunitTreeConfig.loading = true;

        if (this.orgUnit.nodes == null) {
          this.orgunitService.getOrgunitLevelsInformation().subscribe(
              (data: any) => {
                this.orgunitService.getUserInformation().subscribe(
                  (userOrgunit: any) => {
                    let level = this.orgunitService.getUserHighestOrgUnitlevel(userOrgunit);
                    let allLevels = data.pager.total;
                    let orgunits = this.orgunitService.getuserOrganisationUnitsWithHighestlevel(level,userOrgunit);
                    let useLevel = parseInt(allLevels) - (parseInt(level) - 1);

                    //load inital orgunits to speed up loading speed
                    this.orgunitService.getInitialOrgunitsForTree(orgunits).subscribe(
                      (initialData: any) => {
                        this.metadataReady = true;
                        this.organisationunits = initialData.organisationUnits;
                        this.orgUnit = {
                          id: initialData.organisationUnits[0].id,
                          name: initialData.organisationUnits[0].name,
                          children: initialData.organisationUnits[0].children
                        };
                        this.orgUnitLength = this.orgUnit.children.length+1;
                        this.activateNode(this.orgUnit.id, this.orgtree);
                        this.orgunitTreeConfig.loading = false;
                        // after done loading initial organisation units now load all organisation units
                        let fields = this.orgunitService.generateUrlBasedOnLevels(useLevel);
                        this.orgunitService.getAllOrgunitsForTree1(fields, orgunits).subscribe(
                          (items: any) => {
                            this.organisationunits = items.organisationUnits;
                            this.orgUnit.nodes = items.organisationUnits;
                            this.orgunitService.prepareOrganisationUnitTree(this.organisationunits, 'parent');
                          },
                          error => {
                            this.notify.error('OrgUnit','something went wrong while fetching Organisation units');
                            this.orgunitTreeConfig.loading = false;
                          }
                        )
                      },
                      error => {
                        this.notify.error('OrgUnit','something went wrong while fetching Organisation units');
                        this.orgunitTreeConfig.loading = false;
                      }
                    )

                  }
                )
              }
            );
        }
        else {
          this.orgunitTreeConfig.loading = false;
          //console.log(this.orgunit.nodes)
          this.defaultOrgUnit = [this.orgUnit.nodes[0].id];
          this.orgUnit = {
            id: this.orgUnit.nodes[0].id,
            name: this.orgUnit.nodes[0].name,
            children: this.orgUnit.nodes[0].children
          };
          this.orgUnitLength = this.orgUnit.children.length+1;

          this.organisationunits = this.orgUnit.nodes;
          this.activateNode(this.orgUnit.id, this.orgtree);
          this.orgunitService.prepareOrganisationUnitTree(this.organisationunits, 'parent');
          // TODO: make a sort level information dynamic
          this.metadataReady = true;
          // Load the forms;
        }
        this.constant.getSystemInfo().subscribe((currentInfo: any) =>{
        if(!isNullOrUndefined(currentInfo)){
           this.DHIS2_VERSION = currentInfo.version;
           return this.DHIS2_VERSION;
        }
      });


    }
    /**
    Add product item
    **/
    addProductItem():void {
      console.log(`items`,this.items);
      this.products = this.orderForm.get('products') as FormArray;
      if(this.items.length > 0){
        this.products.push(this.prog.createFormGroup(this.items));
      }  
    }
    
    /** Get dataSets for reporting
    **/
    getDataSets(){
      let selectedOrderType = this.entityAttributeForm.get(this.programOrderTypeAttr.id).value;
      let selectDataSetsAllowed = this.dataSetService.getDataSetByMultiAttribute(this.dataSets.dataSets,'LMIS','LMIS_ATTR_DRUG_TYPE',selectedOrderType);

      if((!isNullOrUndefined(selectDataSetsAllowed) && (selectDataSetsAllowed.length === 1))){
          this.enabledDataSets = selectDataSetsAllowed;
          // auto select the dataSets.
          this.dataSetForm.get('selectedDataSetId').setValue(selectDataSetsAllowed[0].id);
          this.getAttributeCombos();
      }
      else{
        this.enabledDataSets = this.dataSetService.getDataSetByAttribute(this.dataSets.dataSets,'LMIS');
      }
    }
    /**
    Return true if disabled
    **/
    isOptionDisabled(isDisabled:boolean,optionComboId:string){
      if(isDisabled){
        this.entityDataEntryForm.get(optionComboId).disable();
       // control.disabled ? control.enable() : control.disable();
      }
    }
    /**
    Load data entry form based on the choosen dataSet.
    **/
    getDataSet(dataSet){
      this.dataEntryFormLoaded = false;

      if(!isNullOrUndefined(dataSet)){
        return this.dataSetService.getDataSetSections(dataSet).subscribe((dataSetObject: any) => {

          return this.dataSetService.getDataElementsByDataSet(dataSet).subscribe((dataElement: any) => {
            this.categoryCombos = [];
            let filteredDataElements: any = [];

            filteredDataElements = this.dataSetService.groupDataElementOptionCombosByName(dataElement.dataElements,this.dataSetService.filterCategoriesByItem(dataElement.dataElements),dataSetObject.sections);

            if(!isUndefined(filteredDataElements)){
              //this.entityDataEntryForm.get('dataElements').setValue(['']);
              this.dataSetService.getCategoryCombos('DISAGGREGATION').subscribe((categoryCombo: any)=>{
                if(dataSetObject.formType === 'SECTION'){
                  this.categoryCombos = this.dataSetService.createSectionDataElementsFormArray(dataSetObject.sections,filteredDataElements);
                }
                else {
                  this.categoryCombos = this.dataSetService.createCategoryComboFormArray(categoryCombo.categoryCombos,filteredDataElements);
                }
                this.buildDataSetForm(this.categoryCombos);
                this.dataSetLoaded = dataSet;

              });
            }
            else{
              this.notify.error("","The data elements are missing ");
            }
          });
        });
      }
      else{

        return this.buildDataSetForm(this.categoryCombos);
      }
    }

    buildDataSetForm(elements){
      this.dataEntryFormLoaded = true;
      this.dataSetElements = elements;
      this.entityDataEntryForm = this.fb.group({
        dataElements: new FormArray([])
      });
      this.dataEntryControl = <FormArray> this.entityDataEntryForm.get('dataElements');
      for(let categoryCombo of elements){
        this.dataEntryControl.push(this.dataSetService.createCategoryComboFormGroup(categoryCombo.dataElements));
      }
      return this.dataEntryControl;
    }
    
    submitTrackerData(){
      this.listData = [];
      // List data is the orderForm Data
      this.listData = this.orderForm.get('products').value;
      this.eventsData = this.prog.createEvents(this.listData,this.selectedProgram);
      this.payload = this.prog.createWebApiPayload(this.uids,this.eventsData,this.entityAttributeForm.value,this.selectedProgram,this.orgUnit.id)
      this.prog.submitTrackedEntityAndEvent(this.payload);
      let message = "Your Order #" + this.entityAttributeForm.value[this.programUniqueIdentifier.trackedEntityAttribute.id] + " has been saved, Proceed to submit patient summaries."
      this.notify.success("", message);
      this.trackedEntitySubmitted = true;

      this.periodId = moment(moment(this.entityAttributeForm.value.dueDate.formatted,'YYYY-MM-DD').subtract(1,'M')).format('YYYYMM');

      this.periodName = moment(moment(this.entityAttributeForm.value.dueDate.formatted,'YYYY-MM-DD').subtract(1,'M')).format('MMMM YYYY');
      this.dataSetForm.get('selectedOrgUnitId').setValue(this.orgUnit.id);
      this.dataSetForm.get('selectedPeriodId').setValue(this.periodId);
      this.getDataSets();

    }
    onChange(m,index) {
      console.log(`ID`,index,`changed item`,m,);
      
      if(m.type == 'PRODUCT_TYPE'){
        this.orderProducts = this.prog.selectType(m);
        this.orderCodes = [];
        this.orderPackage = [];
      }
      else if(m.type == 'PRODUCT'){
        this.orderCodes = m.codes;
        this.orderPackage = [m.package];
      }
      else{
      }

      /**
      Run program rules for program stage data elements
      **/
      //if(this.stageDataElements.length > 0){
          this.prog.getProgramRuleVariables(this.programTreeObject.program.id).subscribe((programRuleVariables: any) => {

            this.prog.getProgramRules(this.programTreeObject.program.id).subscribe((programRules: any) => {

              let actions:any = this.prog.applyProgramRules(programRules.programRules,programRuleVariables.programRuleVariables,'');
              this.runProgramRules(actions,this.trackerEntryFormGroup.value,this.entityAttributeForm.value,this.stageDataElementsMetaData.programStageDataElements);
            });
          });
      //}
    }

    // add item to array of selected items when item is selected
    activateOrg($event){
        this.selectedOrgUnits = [$event.node.data];
        this.orgUnit = $event.node.data;
        // Get programs by orgUnit
        this.prog.getProgramsByOrgUnit(this.orgUnit.id, this.DHIS2_VERSION).subscribe((orgUnitPrograms: any) =>{
          this.orgUnitPrograms = orgUnitPrograms.programs;
          this.orgUnitAncestors = orgUnitPrograms.ancestors;
          this.orgUnitGroups = orgUnitPrograms.organisationUnitGroups;
           // Load programs;
          if(isUndefined(orgUnitPrograms) || isUndefined(orgUnitPrograms.programs) || (orgUnitPrograms.programs.length < 1)){
            this.programsTree = [];
            this.programAssigned = false;
            this.noProgramDataMessage = "No programs available"
            this.notify.info("Program", this.noProgramDataMessage);
          }
          else{
            this.programAssigned = true;
            this.programsTree = this.createProgramTree(this.orgUnitPrograms);

          }
        },
        error => {
          //this.logger.log(" There was an error is generating the tree " + error);
          this.notify.info("Program", "There was an error is generating the tree");
        });

    };


    activateNode(nodeId:any, nodes){
        setTimeout(() => {
          if(!isUndefined(nodes)){
            let node = nodes.treeModel.getNodeById(nodeId);
            if(node){
              node.toggleActivated();
            }
          }
        }, 0);
    }

    // function that is used to filter nodes
    filterNodes(text, tree) {
        tree.treeModel.filterNodes(text, true);
    }

    // display Orgunit Tree
    displayOrgTree(){
        this.showOrgTree = !this.showOrgTree;
    }

    // action to be called when a tree item is deselected(Remove item in array of selected items
    deactivateOrg ( $event ) {
    // this.card_selected_orgunits.forEach((item,index) => {
    //   if( $event.node.data.id == item.id ) {
    //     this.card_selected_orgunits.splice(index, 1);
    //   }
    // });
    }
    createProgramTree(metadata){

        let programTreeNodes: any = [];

        Observable.from(metadata).subscribe((programNode: any) => {
          let programNodes: any = {};
          programNodes.id = programNode.id;
          programNodes.name = programNode.name;
          if(!isUndefined(programNode.programStages)){
            programNodes.children = [];
            Observable.from(programNode.programStages).subscribe((programStageNode: any) => {
              let programStageNodes: any = {};
              programStageNodes.id = programStageNode.id;
              programStageNodes.name = programStageNode.name;
              programStageNodes.program = programStageNode.program;
              programNodes.children.push(programStageNodes);
            });
          }
          programTreeNodes.push(programNodes);

        });
        return programTreeNodes;
    }
    activateProgram($event){
      this.stageFormOpen = false;
      this.trackedEntitySubmitted = false;
        /** Initialize date **/
        let d: Date = new Date();
        this.selDate = {year: d.getFullYear(),
                        month: d.getMonth() + 1,
                        day: d.getDate()};
        this.selectedProgram = [$event.node.data];
        this.programTreeObject = $event.node.data;
        //this.programAttributes = this.getProgramAttributes(this._programsMetaData,this.programTreeObject);


        if(!isNullOrUndefined(this.elmisConfig)){
          this.programWarehouseAttr = this.elmisConfig.warehouse;
          this.programCycleIdentifier = this.elmisConfig.orderCycles;
          this.programDeliveryZoneAttr = this.elmisConfig.deliveryZone;
          this.programOrderTypeAttr = this.elmisConfig.orderType;
          this.programUniqueIdentifier = this.elmisConfig.orderId;
          this.cycles = this.programCycleIdentifier.optionSet.options;
          this.orderTypes = this.programOrderTypeAttr.optionSet.options;
          setTimeout(()=>{
            this.entityAttributeForm = this.fb.group({
              [this.programUniqueIdentifier.id]: [null,Validators.required],
              [this.programWarehouseAttr.id]: [null,Validators.required],
              [this.programDeliveryZoneAttr.id]: [null,Validators.required],
              [this.programOrderTypeAttr.id]: [null,Validators.required],
              [this.programCycleIdentifier.id]: [null,Validators.required],
              'incidentDate': [this.selDate, Validators.required],
              'dueDate':[null, Validators.required]
            });
            /* 
            Fill in the order number 
            */
            this.prog.generateAndReserveId(this.programUniqueIdentifier.id,1).subscribe((generated: any) =>{
              this.generatedValue = generated[0].value;

              this.entityAttributeForm.controls[this.programUniqueIdentifier.id].setValue(this.generatedValue);
              this.uniqueNumberGenerated = true;
              this.programActivated = true;
              this.hideMenu = true;
              this.showMenu = false;
            },
            error => {
              //this.notify.error("Identifier",error);
            });
          },3);          
        }
        else{
          this.notify.error("","Please select a program stage");
        }
        return this.selectedProgram;
    }
    onDateChanged(event:any) {
        // event properties are: event.date, event.jsdate, event.formatted and event.epoc
    }
    onDataValueChanged() {
      //cc: categoryCombo
      //cp: categoryOptions separated by ;
      //co: categoryOptionCombo
      /*
      parameters
      de,ou,pe,co,value,cc,cp,storedBy
      */
      let options = this.getAttributesSelected();
      /** Get the attributeOptionCombos
        **/
      let attributeOptionCombo = this.getAttributeOptionComboSelected(options);
      let valueObject = {
        completeDate: moment().format("YYYY-MM-DD"),
        period:this.dataSetForm.get('selectedPeriodId').value,
        dataSet:this.dataSetForm.get('selectedDataSetId').value,
        orgUnit:this.dataSetForm.get('selectedOrgUnitId').value,
        //attributeOptionCombo:this.dataSetAttributes.id,
        //cp: options.join(';'),
        dataValues : this.getDataValues(this.entityDataEntryForm.value.dataElements,attributeOptionCombo)

      }
      return valueObject;

    }
    getDataValues(values,attributeOptionCombo){
      let dataValues: any = [];
      if(!isNullOrUndefined(values)){
        for(let value of values){
          for(let de in value){
            for(let cc in value[de]){
              for(let occ in value[de][cc]){
                if(attributeOptionCombo !== ""){
                  dataValues.push({dataElement:de,categoryOptionCombo:occ,attributeOptionCombo:attributeOptionCombo, value: value[de][cc][occ]});
                }
                else{
                  dataValues.push({dataElement:de,categoryOptionCombo:occ, value: value[de][cc][occ]});
                 }
              }
            }
          }
        }
      }
      return dataValues;
    }

    getCycle(cycle) {
      if((!isNullOrUndefined(this.programDeliveryZoneAttr.id)) && (!isNullOrUndefined(this.entityAttributeForm.value[this.programDeliveryZoneAttr.id]))){
        /*let zoneData = (this.entityAttributeForm.value[this.programDeliveryZoneAttr.id]).split(' '); // 0 = Drug Type, 1= Supplier Code, 2 = Zone
        let cycleOptionSets = this.dataSetService.getZoneCycles(this.lmisOptionSets.optionSets,zoneData[1]);
        if(zoneData[0] === 'TB'){
          cycleOptionSets = this.dataSetService.getZoneCycles(this.lmisOptionSets.optionSets,zoneData[1]);
        }
        this.dataSetService.getOptionSet(cycleOptionSets.id).subscribe((optionSet:any) => {
          if(!isNullOrUndefined(optionSet.optionSets[0])){
            let optionSetOptions = optionSet.optionSets[0].options;
            let zone = zoneData[2]+ ' '+ zoneData[3];
            let cyclesDeadlineByZone = this.dataSetService.getCycleDeadlineByZone(optionSetOptions,zone ,cycle);
            let deadline = this.dataSetService.getDeadlineDate(cyclesDeadlineByZone);
            if(!isUndefined(deadline)){
              let dueDateString: any = {
                year: moment(deadline.date,'YYYY-MM-DD').get('year'),
                month: moment(deadline.date,'YYYY-MM-DD').get('month') + 1,
                day: moment(deadline.date,'YYYY-MM-DD').get('date')
              };
              this.entityAttributeForm.controls['dueDate'].setValue({ date: dueDateString,formatted:deadline.date });
              this.stageFormOpen = true;
            }
          }
          else{
            this.notify.alert("","Please ensure you have chosen Delivery Zone, Warehouse and Drug type");
          }

        });*/
      }
      else{
        this.notify.alert("","Please Select Delivery Zone");
      }
    }
    /**
    Filter data elements not in the forms (hidden data elements)
    **/
    getHiddenDataElements(formFields,dataElements){
      let counti:number = 0;
      let hiddenDataElements: any = dataElements;
      let hiddenElements: any = [];
      for(let formValue in formFields){
          for(let de of dataElements ){
              if((de.dataElement.id).indexOf(formValue) > -1){
                hiddenDataElements.splice(counti,1);
                hiddenElements = hiddenDataElements;
              }

          }

        counti++;
      }
      return hiddenElements;
    }
    /**
    Test if rule condition has no data elements or attributes with out data
    **/
    testRuleCondition(programRuleCondition,elements){
      let hasData:boolean = false;
      if(!isNullOrUndefined(elements)){
         for(let element of elements){
          let testRuleCondition = JSON.stringify(programRuleCondition);
          let testCond = new RegExp(element.dataElement.id,'gm');
          if(testRuleCondition.indexOf(element.dataElement.id) > -1){
            hasData = true;
            return hasData;
          }

        }
      }       
      return hasData;
    }
    /**
    Run program Rules
    **/
    runProgramRules(programRules,formValues,attrValues,stageDes){

       /** Get those out of the formValues and enable them **/

      for(let programRule of programRules){

        for(let formValue in formValues){
            let regString = new RegExp(formValue,'gm');
            let replacement = "'" + formValues[formValue] + "'";
            programRule.condition = (programRule.condition).replace(regString,replacement);

        }
        for(let attrValue in attrValues){

            let regStringAttr = new RegExp(attrValue,'gm');
            let replacementAttr = "'" + attrValues[attrValue] + "'";
            programRule.condition = (programRule.condition).replace(regStringAttr,replacementAttr);

        }

        if(!isNullOrUndefined(programRule.condition)){
            console.log("The test condition " + JSON.stringify(programRule.condition));
          if(!this.testRuleCondition(programRule.condition,stageDes)){
            if(safeEval(programRule.condition)){
              console.log("The rule " + JSON.stringify(programRule.condition) + " is true");
              for(let programRuleAction of programRule.programRuleActions){
                if((programRuleAction.programRuleActionType === 'ASSIGN') && (!isNullOrUndefined(programRuleAction.data))){

                  for(let formValue in formValues){
                      let formVal = 0;
                      if(!isNullOrUndefined(formValues[formValue])){
                        formVal = formValues[formValue];
                      }
                      let assignString = new RegExp(formValue,'gm');
                      let assignReplacement = "'" + formVal + "'";
                      programRuleAction.data = (programRuleAction.data).replace(assignString,assignReplacement);
                      let d2String = new RegExp('d2:round','gm');
                      let d2Replacement = "Math.round";
                      programRuleAction.data = (programRuleAction.data).replace(d2String,d2Replacement);

                  }
                  for(let attrValue in attrValues){
                      let attrVal = 0;
                      if(!isNullOrUndefined(attrValues[attrValue])){
                        attrVal = attrValues[attrValue];
                      }
                      let assignStringAttr = new RegExp(attrValue,'gm');
                      let assignReplacementAttr = "'" + attrVal + "'";
                      programRuleAction.data = (programRuleAction.data).replace(assignStringAttr,assignReplacementAttr);
                      let d2StringAttr = new RegExp('d2:round','gm');
                      let d2ReplacementAttr = "Math.round";
                      programRuleAction.data = (programRuleAction.data).replace(d2StringAttr,d2ReplacementAttr);

                  }
                  this.isReadOnly = true;
                  //let calculatedValue = 0;
                  //console.log("The rule data " + JSON.stringify(programRuleAction.data) + " is true");
                  let calculatedValue: any = (safeEval(programRuleAction.data));
                  //console.log("Calculated value " + calculatedValue);

                  if(isNaN(calculatedValue)){
                    calculatedValue = 0;
                    //this.notify.info("", "The calculated value is not a number and has been reset to 0");
                  }
                  else if(calculatedValue === 'Infinity'){
                    calculatedValue = 0;
                    this.notify.info("", "The calculated value is Infinity and has been reset to 0");
                  }
                  else{
                    calculatedValue = parseFloat(calculatedValue).toFixed(0);
                  }

                  //this.trackerEntryFormGroup.get(programRuleAction.dataElement.id).patchValue(calculatedValue);
                  if((!isNullOrUndefined(programRuleAction.dataElement.id)) || (!isNullOrUndefined(programRuleAction.dataElement)) || (!isNullOrUndefined(programRuleAction)) || !isNullOrUndefined(<HTMLInputElement>document.getElementById(programRuleAction.dataElement.id))){
                    (<HTMLInputElement>document.getElementById(programRuleAction.dataElement.id)).readOnly = true;
                    let inputX2Model = this.formService.findById(programRuleAction.dataElement.id, this.formModel) as DynamicInputModel;
                    if(!isNullOrUndefined(inputX2Model)){
                        inputX2Model.valueUpdates.next(calculatedValue);
                    }
                  }
                }
                else if(programRuleAction.programRuleActionType === 'ERRORONCOMPLETE'){
                  if(!isNullOrUndefined(programRuleAction.content)){
                    for(let formValue in formValues){

                        programRuleAction.content = (programRuleAction.content).replace(new RegExp(formValue,'gm'),formValues[formValue]);

                    }
                    this.isHidden = false;
                    this.notify.error("",programRuleAction.content);
                  }
                  //this.trackerEntryFormGroup.get(programRuleAction.dataElement.id).markAsDirty(true);
                }
                else if(programRuleAction.programRuleActionType === 'HIDEFIELD'){
                   /** First open all data elements and close what needs to be diabled. **/
                  /*if(!isNullOrUndefined(programRuleAction.content)){
                    for(let formValue in formValues){

                        programRuleAction.content = (programRuleAction.content).replace(new RegExp(formValue,'gm'),formValues[formValue]);

                    }
                    this.isHidden = true;


                  } */
                    this.isHidden = true;
                    let inputXModel = this.formService.findById(programRuleAction.dataElement.id, this.formModel) as DynamicInputModel;
                    if(!isNullOrUndefined(inputXModel)){
                     inputXModel.disabledUpdates.next(true);

                      /** Added to hide/remove control model **/
                      if(!isNullOrUndefined(programRuleAction.dataElement) || !isNullOrUndefined(programRuleAction)){

                        (<HTMLInputElement>document.getElementById(programRuleAction.dataElement.id)).required = false;
                        inputXModel.valueUpdates.next('');
                      }
                    }
                }
                else{
                  if(!isNullOrUndefined(programRuleAction.content)){
                    for(let formValue in formValues){
                        programRuleAction.content = (programRuleAction.content).replace(new RegExp(formValue,'gm'),formValues[formValue]);
                    }
                    let inputXModel = this.formService.findById(programRuleAction.dataElement.id, this.formModel) as DynamicInputModel;
                    if(!isNullOrUndefined(inputXModel)){
                      inputXModel.disabledUpdates.next(false);
                    }

                  }
                }
              }
            }
            else{
              console.log("The rule" + JSON.stringify(programRule.condition) + " is false");
              for(let programRuleAction of programRule.programRuleActions){

                if(programRuleAction.programRuleActionType === 'HIDEFIELD'){
                   /** First open all data elements and close what needs to be diabled. **/
                  /*if(!isNullOrUndefined(programRuleAction.content)){
                    for(let formValue in formValues){

                        programRuleAction.content = (programRuleAction.content).replace(new RegExp(formValue,'gm'),formValues[formValue]);

                    }
                    this.isHidden = true;


                  } */
                    this.isHidden = false;
                    let inputXModel = this.formService.findById(programRuleAction.dataElement.id, this.formModel) as DynamicInputModel;
                    if(!isNullOrUndefined(inputXModel)){
                     inputXModel.disabledUpdates.next(false);

                      /** Added to unhide control model **/
                      /*if(!isNullOrUndefined(programRuleAction.dataElement) || !isNullOrUndefined(programRuleAction)){

                        (<HTMLInputElement>document.getElementById(programRuleAction.dataElement.id)).required = false;
                        inputXModel.valueUpdates.next('');
                      }*/
                    }
                }

              }
            }
          }
          else{
            console.log("The rule contains elements with out data");
          }
        }
        else{
          console.log("The rule is not defined");
        }
      }
    }
    /** Submit Aggregate form
    parameters: ds,ou,pe,multiOu:false,cc,cp (values separated by ;)
    **/
    submitDataEntryForm(){
      this.dataEntryFormLoaded = false;
      let dataValues = this.onDataValueChanged();
      this.dataSetService.saveDataValue(dataValues).subscribe((submittedDataValue: any )=>{
        if((submittedDataValue.status === "SUCCESS") || (submittedDataValue.status === "WARNING")) {
          this.notify.info("","Data has been saved successfully");
          let dataSetComplete = {
            period: dataValues.period,
            organisationUnit: dataValues.orgUnit,
            dataSet: dataValues.dataSet,
            date: dataValues.completeDate,
            attributeOptionCombo: dataValues.dataValues[0].attributeOptionCombo
          }
          this.dataSetService.completeDataSet(dataSetComplete).subscribe((completedDataSet: any ) =>{
            if((completedDataSet.status === "SUCCESS") || (completedDataSet.status === "WARNING")) {
              this.notify.info("","Report has been completed successfully");
              setTimeout(() => {
              this._router.navigate(['listing'],{queryParams:{pe:dataSetComplete.period,ou:dataSetComplete.organisationUnit,ds:dataSetComplete.dataSet,program: this.programTreeObject.program.id}});
              },10000);
            }
            else{
              this.notify.error("",completedDataSet.description);
              this.dataEntryFormLoaded = true;
            }
          });
        }
        else{
          this.notify.error("",submittedDataValue.description);
          this.dataEntryFormLoaded = true;
        }
      });
    }

    /**
    Cancel adding to an order
    **/
    cancelAdd(){
      this.stageFormOpen = false;
      this.trackedEntitySubmitted = false;
      this.orderForm.reset();
    }
    /**
    **/
    getAttributeCombos(){
      this.dataSetAttributesLength = 0;
      this.formStayClosed = true;
      let dataSetId = this.dataSetForm.get('selectedDataSetId').value;
      if((!isNullOrUndefined(dataSetId)) && (dataSetId !== '')){

        this.dataSetService.getDataSetOptionAttributes(dataSetId).subscribe((dataSetObject: any )=>{
          this.dataSetAttributes = dataSetObject.categoryCombo;

          this.dataSetAttributesLength = this.dataSetAttributes.categories.length;
          if(this.dataSetAttributesLength > 0){
            for(let category of this.dataSetAttributes.categories){
              // check category.categoryOptions for cycle data and assign to control
              this.dataSetForm.addControl(category.id,new FormControl({value:'',disabled:false},Validators.required));
            }
            this.dataSetAttributesAvailable = true;
          }

        });
      }
    }
    getAttributeOptionChange():any{

      // Check the length of attributes and ensure it is equal to length before loading form
      let options: any = [];
      this.formStayClosed = true;
      options = this.getAttributesSelected();

      if(options.length === this.dataSetAttributesLength){
        this.formStayClosed = false;

        this.dataEntryFormLoaded = true;
        let dataSetId = this.dataSetForm.get('selectedDataSetId').value;
        if((!isNullOrUndefined(dataSetId)) && (dataSetId !== '')){
            this.getDataSet(dataSetId);
        }
      }
      else{
        this.formStayClosed = true;
      }
      return this.formStayClosed;
    }
    getAttributesSelected(){
      let selectedCategoryAttributes: any = [];
      for(let categoryOption of this.dataSetAttributes.categories){
        let categoryOptionValue = this.dataSetForm.get(categoryOption.id).value;
        if((categoryOptionValue !== "") && (!isNullOrUndefined(categoryOptionValue))){
          selectedCategoryAttributes.push(categoryOptionValue);
        }
      }
      return selectedCategoryAttributes;
    }
    /**
    Get attribute Option Combo from select category Combo attributes
    **/
    getAttributeOptionComboSelected(options){
      let selectedAttributeOptionCombo:string = "";
      if(!isNullOrUndefined(options)){
        for(let attributeOptionCombo of this.dataSetAttributes.categoryOptionCombos){

          if((!isNullOrUndefined(attributeOptionCombo)) && (!isNullOrUndefined(attributeOptionCombo.categoryOptions))){
            if(options.length === attributeOptionCombo.categoryOptions.length){
              let matched = false;
              let matchedCount = 0;
              for(let categoryOption of attributeOptionCombo.categoryOptions){
                if(options.indexOf(categoryOption.id) > -1){
                  matched = true;
                  matchedCount++;
                }
                else{
                  matched = false;
                }
              }
              if((matched) && (matchedCount === options.length)){
                selectedAttributeOptionCombo = attributeOptionCombo.id;
                return selectedAttributeOptionCombo;
              }
            }

          }
        }
      }

    }
    getZone(){
      this.trackerFields = []; //clear form on reload of order
      let selectedWarehouse:any = this.entityAttributeForm.get(this.programWarehouseAttr.id).value;
      if(!isNullOrUndefined(selectedWarehouse)){
        this.zones = selectedWarehouse.zones
        let selectedZone:any = this.entityAttributeForm.get(this.programDeliveryZoneAttr.id).value;
        this.zone = this.dataStoreService.getOrderTypes(selectedZone,this.zones);
      }
      return this.zone;
    }

    getWarehouse(){
      this.trackerFields = []; //clear form on reload of order
      this.stageFormOpen = true;
      this.trackedEntitySubmitted = false;
      let selectedOrderType:any = this.entityAttributeForm.get(this.programOrderTypeAttr.id).value;

      if(!isNullOrUndefined(selectedOrderType)){

        this.orderType = this.dataStoreService.getOrderTypes(selectedOrderType,this.elmisConfig.orderTypes);
        this.warehouses = this.orderType[0].warehouses;
        console.log(`selected order types`,selectedOrderType);
        console.log(`order types`,this.orderType);
        console.log(`order types`,this.orderType[0].productTypes);
        this.items = this.prog.createProducts(this.orderType[0].orderElements,this.elmisConfig.orderElementIds,this.orderType[0].productTypes);
        this.items = [...this.items];
        this.addProductItem();
      }

      /*

      if(!isNullOrUndefined(changedAttribute)){

        this.originalWarehouse = this.orgunitService.getOrgUnitGroupByAttribute(this.orgUnitGroups,'LMIS_ATTR_WAREHOUSE', this.DHIS2_VERSION);
        let originalZone = this.orgunitService.getOrgUnitGroupByAttribute(this.orgUnitGroups,'LMIS_ATTR_DELIVERY_ZONE',this.DHIS2_VERSION);
        let specialZoneOrder = this.orgunitService.getSpecialOrgUnitGroupSetByAttribute(this.orgUnitGroups,'LMIS_TB_WAREHOUSE',changedAttribute,'TB');

          this.orgunitService.getOrgUnitGroups().subscribe((ouGroups:any) =>{
            let specialWarehouse = this.orgunitService.getSpecialOrgUnitGroupByAttribute(ouGroups.organisationUnitGroups,'LMIS_TB_WAREHOUSE',changedAttribute,'TB');
            if(!isNullOrUndefined(specialWarehouse)){
              //if((specialWarehouse.code !== warehouseValue)  && (changedAttribute.indexOf('TB') > -1)) {
              if(changedAttribute.indexOf('TB') > -1) {
                this.warehouse = specialWarehouse;
                this.entityAttributeForm.setControl(this.programWarehouseAttr.id,new FormControl({value:'-1',disabled:false},Validators.required));
                this.entityAttributeForm.controls[this.programWarehouseAttr.id].setValue(this.warehouse.code);


                if(!isNullOrUndefined(specialZoneOrder)){
                  this.zone = this.orgunitService.formatDeliveryZone(specialZoneOrder);

                  this.entityAttributeForm.setControl(this.programDeliveryZoneAttr.id, new FormControl({value:'-1',disabled:false},Validators.required));
                  this.entityAttributeForm.controls[this.programDeliveryZoneAttr.id].setValue(this.zone.code);
                  this.entityAttributeForm.controls[this.programCycleIdentifier.id].setValue('-1');
                  this.entityAttributeForm.controls['dueDate'].setValue(' ');
                }
                else{

                  this.entityAttributeForm.get(this.programDeliveryZoneAttr.id).setValue(this.zone.code);
                }
              }
              else{
                this.warehouse = this.orgunitService.getOrgUnitGroupByAttribute(this.orgUnitGroups,'LMIS_ATTR_WAREHOUSE',this.DHIS2_VERSION);
                let deliveryZones = this.orgunitService.getOrgUnitGroupByAttribute(this.orgUnitGroups,'LMIS_ATTR_DELIVERY_ZONE',this.DHIS2_VERSION);
                this.zone = this.orgunitService.formatDeliveryZone(deliveryZones);
                this.entityAttributeForm.controls[this.programWarehouseAttr.id].setValue(this.warehouse.code);
                this.entityAttributeForm.controls[this.programDeliveryZoneAttr.id].setValue(this.zone.code);
              }
              this.getStageElements(this.programTreeObject.id);
              this.getDropDownChanges(this.programOrderTypeAttr,this.stageDataElements,this.formModel,this.formService);

            }
            else{

              this.warehouse = this.orgunitService.getOrgUnitGroupByAttribute(this.orgUnitGroups,'LMIS_ATTR_WAREHOUSE',this.DHIS2_VERSION);
              let deliveryZones = this.orgunitService.getOrgUnitGroupByAttribute(this.orgUnitGroups,'LMIS_ATTR_DELIVERY_ZONE',this.DHIS2_VERSION);
              this.zone = this.orgunitService.formatDeliveryZone(deliveryZones);
              this.entityAttributeForm.controls[this.programWarehouseAttr.id].setValue(this.warehouse.code);
              this.entityAttributeForm.controls[this.programDeliveryZoneAttr.id].setValue(this.zone.code);

              //Reset cycles and Due Date
               this.entityAttributeForm.controls[this.programCycleIdentifier.id].setValue('-1');
               this.entityAttributeForm.controls['dueDate'].setValue(' ');
              this.getStageElements(this.programTreeObject.id);
              this.getDropDownChanges(this.programOrderTypeAttr,this.stageDataElements,this.formModel,this.formService);
            }
          },
          error =>{
            this.notify.info("", "No " + changedAttribute  + " warehouse selected");
          });
       // },1);
      }
      else{
        this.stageFormOpen = false;

      } */

      /*if(!isNullOrUndefined(selectedOrderType)){

        this.settings = this.createTableHeader(this.stageDataElementsMetaData.programStageDataElements,this.programStageDataElements,selectedOrderType);
      }
      this.addToOrder(this.optionsSearched);
      */
      /**
      Run program rules for program stage data elements when attributes changes
      **/

        /*  this.prog.getProgramRuleVariables(this.programTreeObject.program.id).subscribe((programRuleVariables: any) => {

            this.prog.getProgramRules(this.programTreeObject.program.id).subscribe((programRules: any) => {

              let actions:any = this.prog.applyProgramRules(programRules.programRules,programRuleVariables.programRuleVariables,'');
              this.runProgramRules(actions,this.trackerEntryFormGroup.value,this.entityAttributeForm.value,this.stageDataElementsMetaData.programStageDataElements);
            });
          }); */

    }


    activateMenu(){
      this.showMenu = true;
      this.hideMenu = false;
    }
    updateSectionColumnTotals(sectionj,colTotals,optionCombos,optionid){
      let colTotal: number = 0;
      let values:any = this.entityDataEntryForm.value.dataElements[sectionj];
      if(!isNullOrUndefined(values) && colTotals){
        this.sectionColumnTotals[sectionj] = {};
        for(let de of Object.keys(values)){

          if(!isNullOrUndefined(values[de][optionCombos])){

            let newValue = values[de][optionCombos][optionid];
            if(!isNullOrUndefined(newValue) && (newValue !="") && (newValue != null)){
              colTotal = colTotal + parseInt(newValue);
            }
            else{
              colTotal = colTotal + 0;
            }

          }
          else{
            colTotal = 0;
          }
        }
        (<HTMLInputElement>document.getElementById('col-' + sectionj + "-" + optionid)).value = colTotal.toString();

      }

      return colTotal;
    }
    getCalculatedColumnTotal(val,sectionj,optionCombos,optionid){
      //console.log("Total valuex = " + JSON.stringify(val));
      let value:number = 0;
      if(!isNullOrUndefined(val[sectionj])){
        //console.log("Tota = " + JSON.stringify(document.getElementById('col-' + sectionj + optionid)));
        //for(let optionCombo of optionCombos){
          if(!isNullOrUndefined(val[sectionj][optionCombos])){
            value = (val[sectionj][optionCombos][optionid]);
            return value;
          }
          else{
            //return value;
            /*
            value="{{ getCalculatedColumnTotal(sectionColumnTotals,j,optionCombo.id,optionx.id)}}"
            */
          }
        //}
      }
      else{

        //return value;
      }

    }
}
