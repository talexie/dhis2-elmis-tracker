import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { FormGroup, FormControl, FormArray, FormBuilder,Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject, Subject,AsyncSubject } from 'rxjs';

import {
    DynamicFormControlModel,
    DynamicCheckboxModel,
    DynamicInputModel,
    DynamicSelectModel,
    DynamicDatePickerModel,
    DynamicTimePickerModel,
    DynamicRadioGroupModel,
    DynamicTextAreaModel,
    DynamicFormArrayModel,
    DynamicFormOption,
    DYNAMIC_FORM_CONTROL_TYPE_SELECT
} from '@ng-dynamic-forms/core';
import { isUndefined,isNull,isArray,isNullOrUndefined} from 'util';
// Statics
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/of';

// Operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/reduce';

import { Constants, NotifyService } from '.';

@Injectable()
export class ProgramService {

  public value = 'Programs';
  private DHIS2URL:string;
  private programs: any[];
  private numberOfUids: Number = 20;

  constructor(
    private http: HttpClient,
    private constant: Constants,
    private fb: FormBuilder,
    private notify: NotifyService
  ) {
    this.DHIS2URL = this.constant.ROOTURL;  // URL to web API
  }

  public getPrograms(){

    return this.http.get(this.DHIS2URL + 'api/programs.json?paging=false&fields=id,name,shortName,programType,programStages[id,name,program[id,trackedEntity],notificationTemplates[*]],programTrackedEntityAttributes[id,name,mandatory,valueType,allowFutureDate,displayInList,trackedEntityAttribute[id,name,code,displayName,generated,unique,pattern,optionSet[id,options[id,code,name]]]]');
      //.catch(this.notify.handleError);;
  }
  /**
  get program rule variables by program
  **/
  public getProgramRuleVariables(program){

    return this.http.get(this.DHIS2URL + 'api/programRuleVariables.json?fields=id,displayName,programRuleVariableSourceType,program[id],programStage[id],dataElement[id],trackedEntityAttribute[id],useCodeForOptionSet&filter=program.id:eq:' + program + '&paging=false');
  }
  /**
  Get program rules by program
  **/
  public getProgramRules(program){
    return this.http.get(this.DHIS2URL + 'api/programRules.json?fields=id,displayName,condition,description,program[id],programStage[id],priority,programRuleActions[id,content,location,data,programRuleActionType,programStageSection[id],dataElement[id],trackedEntityAttribute[id],programIndicator[id],programStage[id]]&filter=program.id:eq:' + program + '&paging=false');
  }
  /**
  Get program indicators by program
  **/
  public getProgramIndicators(program){
    return this.http.get(this.DHIS2URL + 'api/programIndicators.json?fields=id,displayName,code,shortName,displayInForm,expression,displayDescription,rootDate,description,valueType,filter&filter=program.id:eq:' + program + '&paging=false');
  }

   /**
  Get data Elements by Stage
  **/
  getDataElementsByProgramStage(programStageId:string){
    return this.http.get(this.DHIS2URL + 'api/programStages/' + programStageId + '/programStageDataElements.json?fields=dataElement[id,name,code,formName,attributeValues[value,attribute[id,code]]]&paging=false');
  }
  /**
  Get stage data elements metadata
  **/
  getProgramStageDataElementsMetaData(programStageId:string){

    return this.http.get(this.DHIS2URL + 'api/programStages/' + programStageId + '/programStageDataElements.json?paging=false&fields=id,compulsory,dataElement[id,name,code,shortName,formName,domainType,aggregateType,valueType,optionSet[id,name,valueType,options[id,name~rename(label),code~rename(value)]]]');
  }
  /** Generate system uids
  **/
  public getSystemUids(uidNumber){
    if(uidNumber < 3 || isUndefined(uidNumber)){
      uidNumber = this.numberOfUids
    }
    return this.http.get(this.DHIS2URL + '/api/system/id.json?limit=' + uidNumber);
  }
  /**
  Get all TEIs by program and Organisation Unit
  **/

  getTrackedEntityInstancesByOu(program:string,orgUnit:string){

    return this.http.get(this.DHIS2URL + 'api/trackedEntityInstances/query.json?ou=' + orgUnit + '&ouMode=DESCENDANTS&program=' + program +'&skipPaging=true');
  }

  /**
   Create payload for WebAPI
  **/
  createWebApiPayload(uids,eventsData,entityAttributeForm,selectedProgramStage,orgUnit){
    let payload: any = {};
    let tei: any = {};
    payload.trackedEntityInstances = [];
    //tei.enrollments = [];
    payload.enrollments = [];
    tei.attributes = [];
    let teiEnrollments: any = {};
    let program: string = '';

    let events: any = [];
    //console.log("program stage meta " + JSON.stringify(selectedProgramStage));
    if((isUndefined(selectedProgramStage[0].children)) && (!isUndefined(selectedProgramStage))){
       tei.trackedEntity = selectedProgramStage[0].program.trackedEntity.id;
       program = selectedProgramStage[0].program.id; // Not required for entity creation
    }
    else{
          console.log("Please choose a program stage");
          return;
    }
    tei.trackedEntityInstance = uids.codes[0];

    tei.orgUnit = orgUnit;
    // Attributes

    for(let attribute in entityAttributeForm){
      if((attribute === 'incidentDate') || (attribute === "dueDate")){

      }
      else{
        tei.attributes.push({ attribute: attribute, value: entityAttributeForm[attribute]});
      }

    }
    // Enrollments
    teiEnrollments.program = program;
    teiEnrollments.orgUnit = tei.orgUnit;
    teiEnrollments.trackedEntityInstance = tei.trackedEntityInstance;
    teiEnrollments.enrollment = uids.codes[1];
    teiEnrollments.incidentDate = entityAttributeForm.incidentDate.value;
    teiEnrollments.enrollmentDate = entityAttributeForm.incidentDate.value;
     // Add coordinate to enrollment object
     /**
     teiEnrollments.coordinate = { latitude: 10.0, longitude: 30.2 }
     **/
    //tei.enrollments.push(teiEnrollments);
    payload.enrollments.push(teiEnrollments);
    payload.trackedEntityInstances.push(tei);
    uids.codes.splice(0,2); // Delete the used uid from UIDs array
    //console.log("Events " + JSON.stringify(eventsData));
    // Events
    for (let event of eventsData){
       //console.log("Event " + JSON.stringify(event));
       event.orgUnit = orgUnit;
       event.trackedEntityInstance = tei.trackedEntityInstance;
       event.enrollment = teiEnrollments.enrollment;
       event.enrollmentStatus = 'ACTIVE';
       event.eventDate = entityAttributeForm.incidentDate.value;
       event.status = 'COMPLETED';
       event.dueDate = entityAttributeForm.dueDate.value;
       events.push(event);
    }
    payload.events = events;
    return payload;
  }

  /** Create events data for web Api from table list data
  **/
  createEvents(tableListData,selectedProgram){
    let eventApiData: any = [];
    for (let listEventObject of tableListData){
      let eventApiDataObject: any = {};
      eventApiDataObject.dataValues = [];
      for ( let listEvent in listEventObject){
        let dataValuesObject: any = {};

        if((isUndefined(selectedProgram[0].children)) && (!isUndefined(selectedProgram))){
          eventApiDataObject.programStage = selectedProgram[0].id;
          eventApiDataObject.program = selectedProgram[0].program.id;

          dataValuesObject.dataElement = listEvent;
          dataValuesObject.value = listEventObject[listEvent];

          //var listEventKey =
          eventApiDataObject.dataValues.push(dataValuesObject);
        }
        else{
          console.log("Please choose a program stage");
        }
      }
      eventApiData.push(eventApiDataObject);
    }
    return eventApiData;
  }
  /** Create a form model
  **
  **/
  createProgramStageFormModel(programStageFormModel,trackerFields, formLoaded){
    console.log("form loaded" + formLoaded);
    if(!formLoaded){
      Observable.from(trackerFields).subscribe(function(fields: any){
          programStageFormModel.push(trackerFields);
      });
    }
    return programStageFormModel;

  }
  /** Get Programs ids and names
  **/
  getProgramIdName(programs){

    let programIdNamesArray: any[] = [];

    Observable.from(programs).subscribe(function(program:any){
        let programIdNames: any = {};
        programIdNames.id = program.id;
        programIdNames.name = program.name;
        programIdNamesArray.push(programIdNames);
    },
    function(error){
      console.log("Error" + error);
    },
    function(){
      console.log("Programs retrieved");
    });
    return programIdNamesArray;
  }

  /**
     Filter data elements by attibute
  **/
  getProgramDataElementsFilteredByAttribute(dataElements:any, trackedEntityEntityAttributeOption:string, attribute:string){
    let filteredDataElementsByOption: any = [];
    if((!isNullOrUndefined(dataElements)) && (!isNullOrUndefined(attribute)) && (!isNullOrUndefined(trackedEntityEntityAttributeOption))){
      //filteredDataElementsByOption =;
      for(let dataElement of dataElements){
        if(!isNullOrUndefined(dataElement.attributeValues)){
          for(let attributeNode of dataElement.attributeValues){
            if(((attributeNode.value === 'ALL') || (attributeNode.value === trackedEntityEntityAttributeOption)) && (attributeNode.attribute.code === attribute)){
              filteredDataElementsByOption.push({name:dataElement.name, id:dataElement.id });
            }
            /*else if(((attributeNode.value === 'ALL') || (attributeNode.value === 'NONE')) && (attributeNode.attribute.code === attribute)){
              filteredDataElementsByOption.push({name:dataElement.name, id:dataElement.id });
            }
            else{
              filteredDataElementsByOption = [];
            }*/
          }
        }
        else{
          //filteredDataElementsByOption.push({name:dataElement.name, id:dataElement.id });
        }
      }
    }
    return filteredDataElementsByOption;
  }
  /** Get program stage data elements
  **/
  getProgramStageDataElements(dataElementsMeta,attrDataElements,programStage,attribute:string){

    let programStageDataElementsArray: any[] = [];
    if(!isNullOrUndefined(programStage)){
      /**
        Filter data elements by attribute
        TO DO: use datastores in config lmis app to keep these data elements per order type
      **/
      if(!isNullOrUndefined(attribute)){
        let modifiedAttribute:string = (attribute.split(' ')).join('_');
        let modifiedCheckedAttribute:string = 'NONE';
        if((modifiedAttribute === 'TB_MDR') ){
          modifiedCheckedAttribute = modifiedAttribute;
        }
        let filteredDataElementsMeta = this.getProgramDataElementsFilteredByAttribute(attrDataElements,modifiedCheckedAttribute,'LMIS_TYPE_OF_DATA_ELEMENT');
        let filteredCheckedDataElementsMeta = this.getOrderDataElements(dataElementsMeta,filteredDataElementsMeta);

        programStageDataElementsArray = this.getDataElementsStageModel(filteredCheckedDataElementsMeta);
      }
    }
    return programStageDataElementsArray;
  }
  /**
  Get the order data elements from meta data
  **/
  getOrderDataElements(dataElements,filteredDataElements){
    let dataElementArray: any[] = [];
    if(!isNullOrUndefined(dataElements)){
      for(let dataElement of dataElements){
        if(!isNullOrUndefined(filteredDataElements)){
          for(let filteredDataElement of filteredDataElements){
            if(dataElement.id === filteredDataElement.id){
              dataElementArray.push(dataElement);
            }
          }
        }
      }
    }
    return dataElementArray;
  }

  /** Get program attributes
  **/
  getProgramAttributes(programAttributesMeta){
    return programAttributesMeta.programTrackedEntityAttributes;
  }

  /** Get unique program attribute [Order Number] **/

  getProgramIdentifier(attributes){
    let identifier: any = {};
    if(!isNullOrUndefined(attributes)){
      for(let attribute of attributes){
        if(attribute.trackedEntityAttribute.unique){
          identifier = attribute;
        }
        else{
          /** No unique attribute set, dont proceed with out an order reference **/
        }
      }
    }
    return identifier;
  }

  /** Get cycle program attribute [Cycles], if Cycles is enabled **/

  getProgramCycleIdentifier(attributes){
    let cycleIdentifier: any = {};
    /** TO DO
     Check if cycles is enabled in the settings
     Only two attributes are allowed on the LMIS program
    **/

    if(!isNullOrUndefined(attributes)){
      for(let attribute of attributes){
        if(!attribute.trackedEntityAttribute.unique){
          cycleIdentifier = attribute;
        }
        else{
          /** No cycles attribute set, dont proceed with out an order reference **/
        }
      }
    }
    return cycleIdentifier;
  }
  /** Get cycle program attribute [Cycles], if Cycles is enabled **/

  getProgramAttributeByCode(attributes,code){
    let attributeObject: any = {};
    /** TO DO
     Check if cycles is enabled in the settings
     Only two attributes are allowed on the LMIS program
    **/

    if(!isNullOrUndefined(attributes)){
      for(let attribute of attributes){
        if(!attribute.trackedEntityAttribute.unique){
          if(attribute.trackedEntityAttribute.code === code ){
            attributeObject = attribute;
          }
        }
        else{
          /** No cycles attribute set, dont proceed with out an order reference **/
        }
      }
    }
    return attributeObject;
  }

  /** Get program from metadata **/
  getProgram(metadata, program){

    let programs:any = [];
    Observable.from(metadata).subscribe(function(prog: any){
      if(prog.id === program){
        programs = prog;
      }

    },
    function(error){
      console.log("Error loading program");

    },
    function(){
      console.log("Program loaded");
    });
    return programs;
  }
  getProgramStage(programMetaData, programStage){
    let programStages:any = [];
    Observable.from(programMetaData.programStages).subscribe(function(stage: any){
      if(stage.id === programStage){
        programStages = stage;
      }
    },
    function(error){
      console.log("Error loading program stage");

    },
    function(){
      console.log("Program stage loaded");
    });
    return programStages;
  }
  /**
  create form group array
  **/
  createFormArray(orderType){
    let formGroupArray: any = {
      id: orderType[0].id,
      label: orderType[0].name,
      type: "ARRAY",
      groups: [],
      groupPrototype:[]
    };
    return formGroupArray;
  }
  /**
  Add item to form group array
  **/
  addItemFormArray(groupArray,group,count){
    if(!isNullOrUndefined(groupArray.groups)){
      let countGroups:number = groupArray.groups.length;
      for(let i=0; i<count;i++){
        groupArray.groups.push({
          group: group,
          index: i
        });
      }
      groupArray.groupPrototype = group;
      groupArray.initialCount = count;
    }
    return [groupArray];
  }
  /**
   Add product item
  **/
  addItem(formGroup,formService,arrayControl,formModel){
    let formArrayControl = formGroup.get(arrayControl) as FormArray;
    let formArrayModel = formService.findById(arrayControl,formModel) as DynamicFormArrayModel;
    return formService.addFormArrayGroup(formArrayControl,formArrayModel);
  }
  /**
   insert product item
  **/
  insertItem(context:DynamicFormArrayModel,formGroup,formService,arrayControl,index){
    let formArrayControl = formGroup.get(arrayControl) as FormArray;
    return formService.insertFormArrayGroup(index,formArrayControl,context);
  }
  /**
   remove product item
  **/
  removeItem(context:DynamicFormArrayModel,formGroup,formService,arrayControl,index){
    let formArrayControl = formGroup.get(arrayControl) as FormArray;
    return formService.removeFormArrayGroup(index,formArrayControl,context);
  }
  /**
  Create a form Model for the formGroup
  **/
  getDataElementsStageModel(orderType){
    let dataElementsArrayGroup:any = {};
    let dataElementsArray:any = [];
    let dataElements:any  = orderType[0].stageDataElements;
    if(!isNullOrUndefined(dataElements)){
      for(let dataElement of dataElements){
          let programStageDataElementsFormFields:any = {};
          programStageDataElementsFormFields.id = dataElement.id;
          //programStageDataElementsFormFields.label = dataElement.formName;
          programStageDataElementsFormFields.ngClass = "isHidden";
          programStageDataElementsFormFields.placeholder = dataElement.formName;
          programStageDataElementsFormFields.validators = {};
          programStageDataElementsFormFields.layout = {
            element:{
              label:"control-label"
            },
            grid:{
              label:"col-lg-2",
              container:"form-inline"
            }
          };
          if(dataElement.compulsory){
            programStageDataElementsFormFields.validators.required = null;

          }
          programStageDataElementsFormFields.errorMessages = { required: dataElement.formName + ' is required'};

          if(dataElement.valueType ==='TEXT'){
            if(!isNullOrUndefined(dataElement.optionSet)){
              programStageDataElementsFormFields.options = dataElement.optionSet.options;
              programStageDataElementsFormFields.type = 'SELECT';
              dataElementsArray.push(programStageDataElementsFormFields);
            }
            else {
              programStageDataElementsFormFields.type = 'INPUT';
              dataElementsArray.push(programStageDataElementsFormFields);
            }
          }
          else if(dataElement.valueType ==='DATE'){
            programStageDataElementsFormFields.value = new Date();
            programStageDataElementsFormFields.inline = true;
            programStageDataElementsFormFields.type = 'DATEPICKER';
            dataElementsArray.push(programStageDataElementsFormFields);
          }
          else if(dataElement.valueType ==='TIME'){
            programStageDataElementsFormFields.inputType = 'time';
            programStageDataElementsFormFields.inline = true;
            programStageDataElementsFormFields.type = 'TIMEPICKER';
            dataElementsArray.push(programStageDataElementsFormFields);
          }
          else if(dataElement.valueType ==='LONG_TEXT') {
            programStageDataElementsFormFields.rows = 3;
            programStageDataElementsFormFields.type = 'TEXTAREA';
            dataElementsArray.push(programStageDataElementsFormFields);
          }
          else if((dataElement.valueType ==='INTEGER_POSITIVE') || (dataElement.valueType ==='INTEGER_ZERO_OR_POSITIVE')){
            programStageDataElementsFormFields.validators.pattern = '^[0-9]{1,9}$';
            programStageDataElementsFormFields.value = 0;
            programStageDataElementsFormFields.validators.required = null;
            programStageDataElementsFormFields.type = 'INPUT';
            dataElementsArray.push(programStageDataElementsFormFields);
          }
          else if(dataElement.valueType ==='INTEGER_NEGATIVE'){
             programStageDataElementsFormFields.validators.pattern = '^[-]?[0-9]{1,9}$';
             programStageDataElementsFormFields.value = 0;
             programStageDataElementsFormFields.validators.required = null;
             programStageDataElementsFormFields.type = 'INPUT';
             dataElementsArray.push(programStageDataElementsFormFields);
          }
          else if(dataElement.valueType ==='INTEGER'){
             programStageDataElementsFormFields.validators.pattern = '^[-]?[0-9]{1,9}$';
             programStageDataElementsFormFields.value = 0;
             programStageDataElementsFormFields.validators.required = null;
             programStageDataElementsFormFields.type = 'INPUT';
             dataElementsArray.push(programStageDataElementsFormFields);
          }
          else if((dataElement.valueType ==='NUMBER') || (dataElement.valueType ==='PERCENTAGE')){
             programStageDataElementsFormFields.validators.pattern = '^(([-]?[0-9]{1,9})|([-]?[0-9]{1,9}[.][0-9]{1,9}))$';
             programStageDataElementsFormFields.value = 0.0;
             programStageDataElementsFormFields.validators.required = null;
             programStageDataElementsFormFields.type = 'INPUT';
             dataElementsArray.push(programStageDataElementsFormFields);
          }
          else{
            programStageDataElementsFormFields.type = 'INPUT';
            dataElementsArray.push(programStageDataElementsFormFields);
          }
      }
    }
    dataElementsArrayGroup.group=dataElementsArray;
    dataElementsArrayGroup.type= "GROUP";
    dataElementsArrayGroup.id= orderType[0].id;
    dataElementsArrayGroup.label= orderType[0].name;
    dataElementsArrayGroup.layout = {
      element:{
        label:"control-label",
        control:"form-inline form-inline-elmis"
      },
      grid:{
        label:"col-lg-4",
        control:"form-inline"
      }
    };
    return [dataElementsArrayGroup];
  }
  /**
  Create a form group for the form group Array
  **/
  createFormGroup(items): FormGroup {    
    let groupItems: any = {};
    if(!isNullOrUndefined(items)){
      for(let item of items){
        groupItems[item.id] = [{value:item.value,validators:Validators.required}];
      }
      return this.fb.group(groupItems);
    }
  }
  /** 
  Get products labels from data elements
  **/

  createProducts(items,orderElements,productTypes?){
    let itemsArray:any = [];
    if(!isNullOrUndefined(items)){
      for(let item of items){
          let itemFields:any = {};
          itemFields.id = item.id;
          itemFields.name = item.name;
          itemFields.code = item.code;
          if(!isNullOrUndefined(item.type)){
            itemFields.type = item.type;
          }
          itemFields.shortName = item.shortName;          
          itemFields.ngClass = "isHidden";
          if(!isNullOrUndefined(item.formName)){
            itemFields.label = item.formName;
            itemFields.placeholder = item.formName;
            itemFields.formName = item.formName;
            itemFields.errorMessages = { required: item.formName + ' is required'};
          }
          if(isNullOrUndefined(item.formName)){
            itemFields.label = item.name;
            itemFields.placeholder = item.name;
            itemFields.formName = item.name;
            itemFields.errorMessages = { required: item.name + ' is required'};
          }
          
          itemFields.validators = {};
          if(item.compulsory){
            itemFields.required = "required";
            itemFields.validators.required = null;

          }      

          if(item.valueType ==='TEXT'){
            if(!isNullOrUndefined(item.optionSet)){
              if(orderElements.orderTypeDataElementId.id === item.id){
                itemFields.options = productTypes;
              }
              else if(orderElements.productTypeDataElementId.id === item.id){
                itemFields.options = [];
              }
              else if(orderElements.basicUnitId.id === item.id){
                itemFields.options = [];
              }
              else{
                itemFields.options = item.optionSet.options;
              }
              itemFields.type = 'SELECT';
              itemsArray.push(itemFields);
            }
            else {
              itemFields.type = 'INPUT';
              itemsArray.push(itemFields);
            }
          }
          else if(item.valueType ==='DATE'){
            itemFields.value = new Date();
            itemFields.inline = true;
            itemFields.type = 'DATEPICKER';
            itemsArray.push(itemFields);
          }
          else if(item.valueType ==='TIME'){
            itemFields.inputType = 'time';
            itemFields.inline = true;
            itemFields.type = 'TIMEPICKER';
            itemsArray.push(itemFields);
          }
          else if(item.valueType ==='LONG_TEXT') {
            itemFields.rows = 3;
            //itemFields.value = "";
            itemFields.type = 'TEXTAREA';
            itemsArray.push(itemFields);
          }
          else if((item.valueType ==='INTEGER_POSITIVE') || (item.valueType ==='INTEGER_ZERO_OR_POSITIVE')){
            itemFields.validators.pattern = '^[0-9]{1,9}$';
            itemFields.value = 0;
            itemFields.validators.required = null;
            itemFields.type = 'INPUT';
            itemsArray.push(itemFields);
          }
          else if(item.valueType ==='INTEGER_NEGATIVE'){
             itemFields.validators.pattern = '^[-]?[0-9]{1,9}$';
             itemFields.value = 0;
             itemFields.validators.required = null;
             itemFields.type = 'INPUT';
             itemsArray.push(itemFields);
          }
          else if(item.valueType ==='INTEGER'){
             itemFields.validators.pattern = '^[-]?[0-9]{1,9}$';
             itemFields.value = 0;
             itemFields.validators.required = null;
             itemFields.type = 'INPUT';
             itemsArray.push(itemFields);
          }
          else if((item.valueType ==='NUMBER') || (item.valueType ==='PERCENTAGE')){
             itemFields.validators.pattern = '^(([-]?[0-9]{1,9})|([-]?[0-9]{1,9}[.][0-9]{1,9}))$';
             itemFields.value = 0.0;
             itemFields.validators.required = null;
             itemFields.type = 'INPUT';
             itemsArray.push(itemFields);
          }
          else{
            itemFields.type = 'INPUT';
            itemFields.value = "  ";
            itemsArray.push(itemFields);
          }
      }
    }
    return itemsArray;
  }
  /**
    Filter by product type selected
  **/
  filterByProductType(id,items){
    let filteredItems: any = [];
    if(!isNullOrUndefined(id) && !isNullOrUndefined(items)){
      if(id == items.id){
      filteredItems = items.products;
      }
    }
  }
  /**
    Filter by product code selected
  **/
  filterByProductCode(id,items){
    let filteredItems: any = [];
    if(!isNullOrUndefined(id) && !isNullOrUndefined(items)){
      if(id == items.id){
      filteredItems = items.package;
      }
    }
  }
  /**
  Create a program tracked attribute model
  **/
  getProgramTrackedEntityAttributesModel(programAttributes){

    let programTrackedEntityAttributesArray: any[] = [];

    Observable.from(programAttributes.programTrackedEntityAttributes).subscribe(function(trackedEntityAttribute:any){
        let programTrackedEntityAttributesFormFields:any = {};
        programTrackedEntityAttributesFormFields.id = trackedEntityAttribute.trackedEntityAttribute.id;
        programTrackedEntityAttributesFormFields.label = trackedEntityAttribute.trackedEntityAttribute.displayName;
        programTrackedEntityAttributesFormFields.placeholder = trackedEntityAttribute.trackedEntityAttribute.displayName;

        // Check mandatory, unique, generated, pattern
        if(trackedEntityAttribute.trackedEntityAttribute.valueType ==='TEXT'){
          if(!isNullOrUndefined(trackedEntityAttribute.trackedEntityAttribute.optionSet)){
            programTrackedEntityAttributesFormFields.options = trackedEntityAttribute.trackedEntityAttribute.optionSet.options;
            programTrackedEntityAttributesArray.push(
              new DynamicSelectModel<string>(
                  programTrackedEntityAttributesFormFields
              )
            );
          }
          else{
            programTrackedEntityAttributesArray.push(
              new DynamicInputModel(
                programTrackedEntityAttributesFormFields
              )
            );
          }
        }
        else if(trackedEntityAttribute.trackedEntityAttribute.valueType ==='DATE'){
          programTrackedEntityAttributesFormFields.value = new Date();
          programTrackedEntityAttributesFormFields.inline = true;
          programTrackedEntityAttributesArray.push(
            new DynamicDatePickerModel(

              programTrackedEntityAttributesFormFields
            )
          );
        }
        else{
          programTrackedEntityAttributesArray.push(
            new DynamicInputModel(
              programTrackedEntityAttributesFormFields
            )
          );
        }

    },
    function(error){
      console.log("Error" + error);
    },
    function(){
      console.log("Program attributes retrieved");
    });
    return programTrackedEntityAttributesArray;
  }

  /**
  Extract the table List titles from program metadata
  **/
  createStageTableHeadings(dataElements,attrDataElements,attribute:string){
    let tableHeadingsArray: any = [];
    //let tableHeadingsArrayx: any = [];
    let tableHeadingsColumns: any = {};
   // let columnArray: any = {};
    if((!isNullOrUndefined(attribute)) && (!isNullOrUndefined(dataElements)) && (!isNullOrUndefined(attrDataElements))){
        let modifiedAttribute:string = (attribute.split(' ')).join('_');
        let modifiedCheckedAttribute:string = 'NONE';
        if((modifiedAttribute === 'TB_MDR') ){
          modifiedCheckedAttribute = modifiedAttribute;
        }
        let filteredDataElementsMeta = this.getProgramDataElementsFilteredByAttribute(attrDataElements,modifiedCheckedAttribute,'LMIS_TYPE_OF_DATA_ELEMENT');
        let filteredCheckedDataElementsMeta = this.getOrderDataElements(dataElements,filteredDataElementsMeta);

        if(!isNullOrUndefined(filteredCheckedDataElementsMeta)){

          //columnArray.columns = {};
          Observable.from(filteredCheckedDataElementsMeta).subscribe(function(dataElement:any){
              let tableHeadings: any = {};
             // let tableHeadingsx: any = {};
              let columnKey = dataElement.id;
              tableHeadings = { key: columnKey, title: dataElement.formName,class:"tableSmartHeading" };
              tableHeadingsArray.push(tableHeadings);
              //tableHeadingsx[columnKey] = {title: dataElement.formName,class:"tableSmartHeading" };
              //tableHeadingsArrayx.push(tableHeadingsx);
          },
          function(error){
            console.log("Error" + error);
          },
          function(){
            console.log("Programs stage table headings retrieved");
          });
         // columnArray.columns = tableHeadingsArrayx;
         tableHeadingsColumns = this.createStringFromArray(tableHeadingsArray);
         //tableHeadingsColumns = this.createStringFromArray(tableHeadingsArray);
        }

    }


    return tableHeadingsColumns;
  }
  createStringFromArray(arrObject){
    var stringObject: any = {};
     stringObject.columns = {};
    if(!isNullOrUndefined(arrObject)){

      arrObject.forEach((obj,idx) => {
          stringObject.columns[obj.key] = { "title" : obj.title };
      });
    }
    return stringObject;
  }
  postTrackedEntity(trackedEntities) {
    let headers: any = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.DHIS2URL + 'api/trackedEntityInstances?strategy=CREATE_AND_UPDATE', trackedEntities, headers);
  }

  postEnrollments(enrollments) {
    let headers: any = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.DHIS2URL + 'api/enrollments?strategy=CREATE_AND_UPDATE', enrollments, headers);
  }

  postEvent(events) {
    let headers: any = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.DHIS2URL + 'api/events?strategy=CREATE_AND_UPDATE', events, headers);
  }
  submitTrackedEntityAndEvent(trackedEntityAndEvents){
    let eventsHandler: any = {};
    let teiHandler: any = {};
    let enrollmentHandler: any = {};
    if(!isNullOrUndefined(trackedEntityAndEvents)){
      teiHandler.trackedEntityInstances = trackedEntityAndEvents.trackedEntityInstances;
      this.postTrackedEntity(teiHandler).subscribe((submitted) =>
      {
        console.log("Tracked Entity has been submitted");
        enrollmentHandler.enrollments = trackedEntityAndEvents.enrollments;
        this.postEnrollments(enrollmentHandler).subscribe((submittedEnrollment) =>
        {
          console.log("Tracked Entity has been enrolled");
          eventsHandler.events = trackedEntityAndEvents.events;
          this.postEvent(eventsHandler).subscribe((submittedEvents) =>
          {
            console.log("Events has been submitted");

          });
        });
      });

    }
  }
  /** Retrieve the programs assigned to the selected program **/
  getProgramsByOrgUnit(orgUnit,version){
    if(version === "2.27"){
      console.log("version " + version);
       return this.http.get(this.DHIS2URL + 'api/organisationUnits/' + orgUnit + '.json?paging=false&fields=programs[id,name,shortName,programType,programStages[id,name,program[id,trackedEntity]]],organisationUnitGroups[id,name,code,attributeValues[value,attribute[id,code]],groupSets[id,name,code,attributeValues[value,attribute[id,code]]]],ancestors[id,name,level]');
    }
    else{
      console.log("versionx " + version);
       return this.http.get(this.DHIS2URL + 'api/organisationUnits/' + orgUnit + '.json?paging=false&fields=programs[id,name,shortName,programType,programStages[id,name,program[id,trackedEntity]]],organisationUnitGroups[id,name,code,attributeValues[value,attribute[id,code]],organisationUnitGroupSet[id,name,code,attributeValues[value,attribute[id,code]]]],ancestors[id,name,level]');
    }

  }
  /**
  Generate value and reserve it for use as Order identifier.
  **/
  generateAndReserveId(attribute,limit){
    return this.http.get(this.DHIS2URL + 'api/trackedEntityAttributes/' + attribute + '/generateAndReserve.json?numberToReserve=' + limit);
  }

  getGenerateAndReserveId(attribute,limit){
    let generatedValue: string = '';
    this.generateAndReserveId(attribute,limit).subscribe((generated) =>{
     generatedValue = generated[0].value;
    },
    error => {
      console.log("Identifier",error);
    });
  }

  getGeneratorAttributeValue(programsMetaData){
    let attributeValue: any = [];
    for(let program of programsMetaData){

      for(let attrValue  of program.programTrackedEntityAttributes){
        if(attrValue.trackedEntityAttribute.generated){
          attributeValue.push({ program: program.id,[attrValue.trackedEntityAttribute.id]: this.getGenerateAndReserveId(attrValue.trackedEntityAttribute.id,1) });
        }
      }
    }
    return attributeValue;
  }
  filterGeneratedAttributeByProgram(attributeGeneratedValues,program){
    let filteredAttributeValue: any = {};
    if((!isUndefined(attributeGeneratedValues)) && (!isUndefined(program))){
      for(let generatedValue of attributeGeneratedValues){
        if(generatedValue.program === program){
          filteredAttributeValue = generatedValue;
        }
      }
    }
    else{
      console.log("The generated value process has failed.");
    }
    return filteredAttributeValue;
  }
  /** Apply program rules
     Matcher RegExp: /[A#]{\w+.?\w*}/g

    Apply program Rules for calculated fields
  **/

  applyProgramRules(programRules,programRuleVariables,attributeFormGroupValues){
    let programRulesWithActions: any = [];
    for(let programRule of programRules){
      for(let programRuleVariable of programRuleVariables){
        if(programRuleVariable.programRuleVariableSourceType === 'DATAELEMENT_CURRENT_EVENT')
        {
          let deCurrString = new RegExp('#{' + programRuleVariable.displayName + '}','gm');
          programRule.condition = (programRule.condition).replace(deCurrString,programRuleVariable.dataElement.id);
        }
        else if(programRuleVariable.programRuleVariableSourceType === 'TEI_ATTRIBUTE')
        {
          let teiCurrString = new RegExp('#{' + programRuleVariable.displayName + '}','gm');
          programRule.condition = (programRule.condition).replace(teiCurrString,programRuleVariable.trackedEntityAttribute.id);
        }
        else{
          console.log("Not implemented");
        }
      }
      for(let programRuleVariable of programRuleVariables){
        for(let programRuleAction of programRule.programRuleActions){
          //if(!isNull((programRuleAction.data).match(programRuleVariable.displayName))){
            if(programRuleVariable.programRuleVariableSourceType === 'DATAELEMENT_CURRENT_EVENT'){
              if(programRuleAction.programRuleActionType === 'ASSIGN'){
                let deRCurrString = new RegExp('#{' + programRuleVariable.displayName + '}','gm');
                programRuleAction.data = (programRuleAction.data).replace(deRCurrString,programRuleVariable.dataElement.id);
              }
              else{
                let deXCurrString = new RegExp('#{' + programRuleVariable.displayName + '}','gm');
                programRuleAction.content = (programRuleAction.content).replace(deXCurrString,programRuleVariable.dataElement.id);
              }
            }
            else if(programRuleVariable.programRuleVariableSourceType === 'TEI_ATTRIBUTE'){
              if(programRuleAction.programRuleActionType === 'ASSIGN'){
                let deTeiCurrString = new RegExp('#{' + programRuleVariable.displayName + '}','gm');
                programRuleAction.data = (programRuleAction.data).replace(deTeiCurrString,programRuleVariable.trackedEntityAttribute.id);
              }
              else{
                let deTeiXCurrString = new RegExp('#{' + programRuleVariable.displayName + '}','gm');
                programRuleAction.content = (programRuleAction.content).replace(deTeiXCurrString,programRuleVariable.trackedEntityAttribute.id);
              }
            }
            else{
              console.log("Rule variable action not implemented.");
            }
          //}
        }
      }
      programRulesWithActions.push(programRule);
    }
    return programRulesWithActions;
  }

  /** Get program stage data elements without model
  **/
  getProgramStageDataElementsNoModel(dataElementsMeta){

    let programStageDataElementsArray: any[] = [];
    if(!isNullOrUndefined(dataElementsMeta)){
      Observable.from(dataElementsMeta).subscribe(function(dataElements:any){
        let dataElement:any = {};

        if(dataElements.dataElement.valueType ==='TEXT'){
          if(!isNullOrUndefined(dataElements.dataElement.optionSet)){
            dataElement.id = dataElements.dataElement.id;
            dataElement.optionSetId = dataElements.dataElement.optionSet.id;
            dataElement.options = dataElements.dataElement.optionSet.options;
            programStageDataElementsArray.push(dataElement);
          }
        }

      },
      function(error){
        console.log("Error" + error);
      },
      function(){
        console.log("Program dataelements optionSets retrieved");
      });
    }
    return programStageDataElementsArray;
  }
  /**
  update data element stage Model
  **/
  updateSelectModel(formModel,id,formService,options){
    if((!isUndefined(options)) && (!isNull(options))){
      let inputModel = formService.findById(id, formModel) as DynamicSelectModel<string[]>;
      if(!isNullOrUndefined(inputModel)){
        inputModel.options = options;
        return inputModel;
      }
    }
    else{
      console.log("input model is" + options);
    }
  }
  /**
   Get orderType from dataStore elmis config
  **/
  getOrderType(orderType:any,config:any){
    let orders: any = {
      code:"None",
      name:"None"
    };
    if(!isNullOrUndefined(config) && !isNullOrUndefined(config.orderTypes) && !isNullOrUndefined(orderType)){
      for(let orderTypeObject of config.orderTypes){
        if(orderTypeObject.id == orderType.id){
          orders = orderTypeObject;
          return orders;
        }
      }
    }
    else{
      return orders;
    }
  }
  /**
   Filter items from selected items
  **/
  filterArrayItemsById(items,id){
    let filteredItems: any = [];
    if((!isNullOrUndefined(id)) && (!isNullOrUndefined(items))){
      filteredItems = items.filter(item =>{
        return (item.id == id);
      });
    }
    return filteredItems;
  }
  /**
   Filter items by type
  **/
  selectType(item){
    let filteredItems: any = [];
    if(!isNullOrUndefined(item)) {
      if(item.type == "ORDER_TYPE"){        
        filteredItems= item.productTypes;
      }
      else if(item.type == "PRODUCT_TYPE"){
        filteredItems=item.products;
      }
      else if(item.type == "PRODUCT"){
        filteredItems= item;
      }
      else if(item.type == "PACKAGE"){
        filteredItems= item.package;
      }
      else{
        filteredItems= item;
      }
    }
    return filteredItems;
  }
}
