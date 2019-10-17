import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { FormGroup, FormControl, FormArray, FormBuilder,Validators } from '@angular/forms';
import { Observable, Subscription } from "rxjs";
import { isUndefined,isNull,isArray, isNullOrUndefined } from 'util';
import {
    DynamicFormControlModel,
    DynamicCheckboxModel,
    DynamicInputModel,
    DynamicSelectModel,
    DynamicDatePickerModel,
    DynamicRadioGroupModel
} from '@ng-dynamic-forms/core';
import { NotifyService } from './notify.service';
import { Constants  } from './constants';
import 'rxjs/add/operator/filter';
import * as moment from 'moment';
/**
 * Created by Alex Tumwesigye, Feb 2017.
 */
@Injectable()
export class DataSetService {
    private DHIS2URL: string;

    constructor(
      private notify: NotifyService,
      private constant: Constants,
      private fb: FormBuilder,
      private http: HttpClient
      ){
      this.DHIS2URL = this.constant.ROOTURL;
    }
    /** Get all Datasets with LMIS attribute
    **/
    getDataSets(){
	    return this.http.get(this.DHIS2URL + 'api/dataSets.json?paging=false&fields=id,name,code,shortName,attributeValues[value,attribute[id,name,code]]&filter=attributeValues.value:eq:true');
	}

	/** Get all Dataset Data Elements with LMIS attribute
    **/
    getDataSet(dataSet){
	    return this.http.get(this.DHIS2URL + 'api/dataSets/' + dataSet + '.json?paging=false&fields=id,name,code,shortName,formType,expiryDays, timelyDays,openFuturePeriods,fieldCombinationRequired,dataSetElements[dataElement[id,name,code]]');
	}
	/** Get all Dataset Sections
    **/
    getDataSetSections(dataSet){
	    return this.http.get(this.DHIS2URL + 'api/dataSets/' + dataSet + '.json?paging=false&fields=id,name,code,shortName,formType,expiryDays, timelyDays,openFuturePeriods,fieldCombinationRequired,sections[id,name,showColumnTotals,greyedFields[id],dataElements[id]]');
	}
	getDataSetOptionAttributes(dataSet){
	    return this.http.get(this.DHIS2URL + 'api/dataSets/' + dataSet + '.json?paging=false&fields=id,name,code,shortName,formType,expiryDays, timelyDays,openFuturePeriods,fieldCombinationRequired,categoryCombo[id,code,name,categoryOptionCombos[id,categoryOptions[id]],categories[id,name,code,categoryOptions[id,name,code]]]&filter=id:eq:' + dataSet);
	}

	/** Get all OptionSets with LMIS attribute
    **/
    getOptionSets(){
	    return this.http.get(this.DHIS2URL + 'api/optionSets.json?paging=false&fields=id,name,code,shortName,attributeValues[value,attribute[id,name,code]]&filter=attributeValues.value:eq:true');
	}

	/** Get OptionSets by Id
    **/
    getOptionSet(optionSet:string){
	    return this.http.get(this.DHIS2URL + 'api/optionSets.json?paging=false&fields=id,name,code,shortName,options[id,name,code,value]&filter=id:eq:'+ optionSet);
	}
	/** Get Option by Code
    **/
    getOptionByCode(optionCode:string){
	    return this.http.get(this.DHIS2URL + 'api/options.json?paging=false&fields=id,name,code,value,attributeValues[value,attribute[id,name,code]&filter=code:eq:'+ optionCode);
	}
	/** Get n OptionSets by Id
    **/
    getNOptionSet(optionSet:any[]){
	    return this.http.get(this.DHIS2URL + 'api/optionSets.json?paging=false&fields=id,name,code,shortName,options[id,name,code,value,attributeValues[value,attribute[id,name,code]]&filter=id:in:[' + optionSet + ']');
	}

	/** Get all DataElements for a given dataSet **/
	getDataElementOperands(dataSet:string){
		return this.http.get(this.DHIS2URL + 'api/dataElementOperands.json?paging=false&fields=id,name,shortName,optionComboId,frequencyOrder,aggregationType,valueType,dataElementId,categoryOptionCombo[id,name,categoryCombo[id,name]],dataElement[id,code,name,shortName,domainType,zeroIsSignificant]&filter=dataElement.dataSetElements.dataSet.id:eq:'+ dataSet);
	}
	/** Get Object by Code
    **/
    getObjectByCode(object:string,code:string){
	    return this.http.get(this.DHIS2URL + 'api/' + object + '.json?paging=false&fields=id,name,code,value,attributeValues[value,attribute[id,name,code]&filter=code:eq:'+ code);
	}

	/**
	Use this, it is faster
api/dataElements.json?paging=false&fields=id,name,valueType,categoryCombo[id,name,dataDimensionType,categoryOptionCombos[id,name,categoryOptions[id,name]]]&filter=dataSetElements.dataSet.id:eq:LbRczM2QQSN
	**/
	getDataElementsByDataSet(dataSet:string){
		return this.http.get(this.DHIS2URL + 'api/dataElements.json?paging=false&fields=id,name,code,formName,valueType,categoryCombo[id,name,dataDimensionType,categories[id,name,items[id,name]],categoryOptionCombos[id,name]]&filter=dataSetElements.dataSet.id:eq:'+ dataSet);
	}

	/** Save data Value via WebAPI
	**/
	saveDataValue(dataValues) {
	    let headers:any = new HttpHeaders({ 'Content-Type': 'application/json' });
	    return this.http.post(this.DHIS2URL + 'api/dataValueSets?importStrategy=CREATE_AND_UPDATE', dataValues, headers);
	}
	/** Complete DataSets via WebAPI
	**/
	completeDataSet(dataValues) {
	    let headers:any = new HttpHeaders({ 'Content-Type': 'application/json' });
	    return this.http.post(this.DHIS2URL + 'api/completeDataSetRegistrations?importStrategy=CREATE_AND_UPDATE', dataValues, headers);
	}

	/**
	filter and group by category.
	**/
	filterCategoriesByItem(dataElements: any[]){
		let headers: any = [];
		if(!isUndefined(dataElements)){
			for(let dataElement of dataElements){

				let categories: any = [];
				let i: number = 0;
				let j: number = 0;

				//for(let category of dataElement.categoryCombo.categories){
					if(dataElement.categoryCombo.categories.length === 1){
						categories = dataElement.categoryCombo.categories[0].items;
					}
					else if(dataElement.categoryCombo.categories.length === 2){
						for(let item of dataElement.categoryCombo.categories[0].items){
							let categoryObject = dataElement.categoryCombo.categories[1];
							categories.push({id:item.id,name:item.name,children: categoryObject.items});
						}

					}
					else{

					}

				//}
				headers.push({id: dataElement.id, name: dataElement.name,formName: dataElement.formName, categories: categories });
			}

		}
		return headers;
	}

	/** Group optionCombos by Category options for each data element
	**/
	groupDataElementOptionCombosByName(dataElements, dataElementHeaders,sections){
		let groupedDataElementsOptionCombos: any = [];
		if(!isUndefined(dataElements)){
			for(let dataElement of dataElements){
				let dataElementObject =  {
					id:dataElement.id,
					name:dataElement.name,
					formName:dataElement.formName,
					valueType: dataElement.valueType,
					categoryCombo:{
						id:dataElement.categoryCombo.id,
						name:dataElement.categoryCombo.name
					},
					optionCombos: []
				};
				for(let header of dataElementHeaders){ // Use a filter here to filter DE
					if(header.id ===  dataElement.id){
						let optionCombos: any = [];
						for(let category of header.categories){
							let options: any = [];

							if(!isNullOrUndefined(category.children)){
								for(let item of category.children){

									for(let optionCombo of dataElement.categoryCombo.categoryOptionCombos){
										let optionComboArrayName =  (optionCombo.name).split(',');
										let loc = optionComboArrayName.length -1;
										let greyed:boolean = false;
										if((category.name === (optionComboArrayName[loc] ).trim()) && (loc === 1) && (item.name === (optionComboArrayName[loc-1] ).trim())){
											greyed = this.checkDataElementIfGreyed(dataElement.id,optionCombo.id,sections);
											options.push({id:optionCombo.id,disabled: greyed,name:optionCombo.name,title:item.name});
										}

									}
								}
							}
							else{

								for(let optionCombo of dataElement.categoryCombo.categoryOptionCombos){
									let greyed:boolean = false;

									if(category.name === optionCombo.name){
										greyed = this.checkDataElementIfGreyed(dataElement.id,optionCombo.id,sections);
										options.push({id:optionCombo.id,disabled: greyed,name:optionCombo.name,title:category.name});
									}
								}
							}
 							/*
							for(let optionCombo of dataElement.categoryCombo.categoryOptionCombos){

								let optionComboArrayName =  (optionCombo.name).split(',');
								let loc = optionComboArrayName.length -1;
								let greyed:boolean = false;
								//let options: any = [];
								greyed = this.checkDataElementIfGreyed(dataElement.id,optionCombo.id,sections);
								if((category.name === optionComboArrayName[loc] ) && (loc === 0)) {

									options.push({id:optionCombo.id,disabled: greyed,name:optionCombo.name,title:category.name});

								}
								else if((category.name === (optionComboArrayName[loc] ).trim()) && (loc === 1)) {

									for(let cat of category.children){

										if(cat.name === optionComboArrayName[loc-1]){
											options.push({id:optionCombo.id,disabled: greyed,name:optionCombo.name,title:cat.name});

										}

									}

								}
								else{

								}
							}*/
							optionCombos.push({
								id: category.id,
								name: category.name,
								options:options

							});
						}
						dataElementObject.optionCombos = optionCombos;
					}
				}
				groupedDataElementsOptionCombos.push(dataElementObject);
			}
		}
		return groupedDataElementsOptionCombos;
	}

    /** Check if the dataElement OptionCombos is greyed
    **/

    checkDataElementIfGreyed(dataElementId:String,optionComboId:string,sections){
    	let greyed:boolean = false;
    	if(!isNullOrUndefined(dataElementId) && !isNullOrUndefined(dataElementId)){
    		let dataElementOptionComboId:String = dataElementId + "." + optionComboId;
    		if(!isNullOrUndefined(sections)){
    			for(let section of sections){
    				if(!isNullOrUndefined(section.greyedFields)){
    					for(let greyedDataElement of section.greyedFields){
    						if(!isNullOrUndefined(greyedDataElement)){
    							if(greyedDataElement.id === dataElementOptionComboId){
    								greyed = true;
    								return greyed;
    							}
    						}
    					}
    				}
    			}
    		}
    	}
    	return greyed;
    }
	/** Get all categoryCombos by dataDimensionType
		@param: dataDimensionType { ATTRIBUTE or DISAGGREGATION }

	**/
	getCategoryCombos(dataDimensionType:string){
		return this.http.get(this.DHIS2URL + 'api/categoryCombos.json?paging=false&fields=id,name,code&filter=dataDimensionType:eq:'+ dataDimensionType);
	}

	/**
	 filter by categoryCombos
	**/
	filterByCategoryCombos(dataElementsOperands,categoryCombo){
		let filteredDataElementOperands: any = [];
		if(!isUndefined(dataElementsOperands)){
			for(let dataElementsOperand of dataElementsOperands){
				if(dataElementsOperand.optionCombos[0].categoryOptionCombo.categoryCombo.id === categoryCombo){
					filteredDataElementOperands.push(dataElementsOperand);
				}
			}
		}
		return filteredDataElementOperands;
	}
	/**
	 filter elements by categoryCombos
	**/
	filterElementsByCategoryCombos(elements,categoryCombo){
		let filteredElements: any = [];
		if(!isUndefined(elements)){
			for(let element of elements){
				if(element.categoryCombo.id === categoryCombo){
					filteredElements.push(element);
				}
			}
		}
		return filteredElements;
	}
	/**
	 filter elements by sections
	**/
	filterElementsBySections(elements,section){
		let filteredElements: any = [];
		if(!isUndefined(elements)){
			for(let sectionDataElement of section.dataElements){
				for(let element of elements){
					if(element.id === sectionDataElement.id){
						filteredElements.push(element);
					}
				}
			}
		}
		return filteredElements;
	}
	/**
	 Create an array of categoryCombos
	**/
	createCategoryComboFormArray(categoryCombos,dataElementsOperands){
		let categoryComboArray: any = [];

		if((!isUndefined(categoryCombos)) && (!isUndefined(dataElementsOperands))){
			for(let categoryCombo of categoryCombos){
				let filteredDataElementsByCategoryCombo = this.filterElementsByCategoryCombos(dataElementsOperands,categoryCombo.id);
				if(filteredDataElementsByCategoryCombo.length > 0){
					categoryComboArray.push({id:categoryCombo.id,name:categoryCombo.name, dataElements: filteredDataElementsByCategoryCombo});
				}
			}
		}
		else{
			// Not defined or empty array
		}
		return categoryComboArray;
	}
	/**
	 Create an array of sections of data elements
	**/
	createSectionDataElementsFormArray(sections,filteredDataElements){
		let sectionArray: any = [];

		if((!isUndefined(sections)) && (!isUndefined(filteredDataElements))){
			for(let section of sections){
				let filteredDataElementsBySection = this.filterElementsBySections(filteredDataElements,section);
				if(filteredDataElementsBySection.length > 0){
					sectionArray.push({id:section.id,name:section.name,showColumnTotals: section.showColumnTotals, dataElements: filteredDataElementsBySection});
				}
			}
		}
		else{
			// Not defined or empty array
		}
		return sectionArray;
	}

	/** Get dataSets by LMIS attribute
	**/
	getDataSetByAttribute(dataSets,attributeKey){
		let dataSetsArray: any =  [];
		if(!isUndefined(dataSets)){
			for(let dataSet of dataSets){
				for(let attribute of dataSet.attributeValues){
					if(attribute.attribute.code === attributeKey){
						dataSetsArray.push(dataSet);
					}
				}

			}
		}
		return dataSetsArray;
	}
	/** Get selected dataSets by LMIS attribute and other keys
	**/
	getDataSetByMultiAttribute(dataSets,attributeKey, attributeNextKey,selectedValue){
		let dataSetsArray: any =  [];
		if(!isUndefined(dataSets)){
			for(let dataSet of dataSets){
				for(let attribute of dataSet.attributeValues){
					if(attribute.attribute.code === attributeKey){
						for(let attributeNext of dataSet.attributeValues){
							if((attributeNext.attribute.code === attributeNextKey) && (attributeNext.value === selectedValue)) {
								dataSetsArray.push(dataSet);
							}
						}
					}
				}

			}
		}
		return dataSetsArray;
	}

	filterObjectByAttribute(confObject,attributeKey){
		let dataSetsArray: any =  [];
		if(!isUndefined(confObject)){
			for(let dataSet of confObject){
				let dataSetObject: any = {};
				dataSetObject.id = dataSet.id;
				dataSetObject.value = dataSet.id;
				dataSetObject.name = dataSet.name;
				dataSetObject.label = dataSet.name;
				dataSetObject.code = dataSet.code;
				dataSetObject.shortName = dataSet.shortName;
				dataSetObject.attributeValues = [];
				if(!isUndefined(dataSet)){
					for(let attribute of dataSet.attributeValues){
						if(attribute.attribute.code === attributeKey){
							dataSetObject.attributeId = attribute.attribute.id;
							dataSetObject.attributeValue = attribute.value;
							dataSetObject.attributeCode = attribute.attribute.code;
							dataSetObject.attributeName = attribute.attribute.name;
							//dataSetObject.attributeValues = dataSet.attributeValues;
						}
					}
				}
				dataSetsArray.push(dataSetObject);
			}
		}
		return dataSetsArray;
	}
	getCyclesOptionSet(optionSets:any, attribute:string){
		let cycleOptionSet:any = [];
		if(!isUndefined(optionSets)){
			for(let optionSet of optionSets.optionSets){
				if(optionSet.attributeCode === attribute){
					cycleOptionSet.push(optionSet);
				}
			}
		}
		return cycleOptionSet;
	}

	/**
	 Get optionSet by attribute
	 **/
	getOptionSetByAttribute(optionSets:any, attribute:string){
		let selectedOptions:any = [];
		if(!isUndefined(optionSets)){
			for(let optionSet of optionSets.optionSets){
				if(optionSet.attributeCode === attribute){
					selectedOptions.push(optionSet);
				}
			}
		}
		return selectedOptions;
	}
	/**
	 Get DataElement by attribute
	 **/
	getDataElementByAttribute(dataElements:any, attribute:string){

		if(!isUndefined(dataElements)){
			for(let dataElement of dataElements){
				if((!isUndefined(dataElement)) && ((dataElement.dataElement.attributeValues).length > 0)){

					for(let attributeValue of dataElement.dataElement.attributeValues){

						if((attributeValue.attribute.code === attribute) && (attributeValue.value === "true")){

							return dataElement;
						}
					}
				}
			}
		}
	}
	/**
	 Get program Data element by optionSet
	 No two data elements in a program stage will have the same optionSets for LMIS
	 **/
	getDataElementWithOptionSet(dataElements:any,optionSet:string){
		for(let dataElement of dataElements){
			if(dataElement.optionSetId === optionSet){
				return dataElement;
			}
		}
	}

	/**
	 Get options by attribute
	 **/
	getOptionsByAttribute(optionSet:any, attribute:string){
		let selectedOptions:any = [];
		if(!isUndefined(optionSet)){
			for(let option of optionSet.options){
				for(let attributeValue of option.attributeValues){
					if(attributeValue.value === attribute){
						selectedOptions.push({
							id: option.id,
							value: option.code,
							label: option.name,
							code: option.code,
							name: option.name
						});
					}

				}
			}
		}
		return selectedOptions;
	}
	/**
	Get N optionSets from stage data elements
	**/
	getNOptionSetsFromDataElements(dataElements:any[]){
		let nOptionSets:any = [];
		if(!isUndefined(nOptionSets)){
			for(let optionSet of dataElements){
				if(!isNull(optionSet.optionSetId)){
					nOptionSets.push(optionSet.optionSetId);
				}
			}
		}
		return nOptionSets;
	}
	/**
	Get keys for searching and filtering
	**/
	getSearchOptionSet(optionSets:any, attribute:any){
		for(let optionSet of optionSets){
			if(!isUndefined(optionSet.options)){
				for(let option of optionSet.options){
					if(!isUndefined(option.attributeValues)){
						for(let attributeValue of option.attributeValues){
							if(attributeValue.value === attribute){
								return optionSet;
							}

						}
					}
				}
			}
		}

	}
	/**
	get Attribute Value by OptionCode
	**/
	getOptionAttributeValueByCode(options:any[],attributeCode){
		if(!isUndefined(options)){
			for(let option of options){
				if(!isUndefined(option)){
					for(let attribute of option.attributeValues){
						if(attribute.attribute.code === attributeCode ){
							return attribute.value;
						}
					}
				}
			}
		}

	}
	/**
	Get keys for searching and filtering
	**/

	getSearchKeys(optionSets){
		for(let optionSet of optionSets){
		 let searchKeys: any = [];
			if(!isUndefined(optionSet.attributeValues)){
				for(let attributeValue of optionSet.attributeValues){
					if(((attributeValue.attribute.code).indexOf('LMIS')) > -1){
						searchKeys.push({
							id: optionSet.id,
							code: optionSet.code,
							name: optionSet.name,
							searchKey: attributeValue.value,
							options:optionSet.options
						});
					}

				}
			}
		}

	}
	createFormModelItem(formModel,dataObject, type,name,placeholder){
		let checkModelExists: boolean = false;
		checkModelExists = this.checkIfFormModelExists(formModel,name);
		if(!checkModelExists){
			if(type === "select"){
				let formFields:any = {};
		        formFields.id = name;
		        formFields.placeholder = placeholder;
		        formFields.options = dataObject;
		        formModel.push(
			        new DynamicSelectModel<string>(
			            formFields
			        )
		        );
	    	}
	    }
        return formModel;
	}
	updateFormModelItem(formModel,dataObject,id){
		for(let modelObject of formModel){
			if(modelObject.id === id){
				modelObject.options = dataObject;
			}
		}
        return formModel;
	}
	checkIfFormModelExists(formModel,id){
		let formModelExists: boolean = false;
		if(!isUndefined(formModel)){
			for(let modelObject of formModel){
				if(modelObject.id === id){
					formModelExists = true;
				}
			}
		}
		return formModelExists;
	}
	/** Create DataEntryForm for DataSet
	**/

	createDataEntryForm(dataElements){
		let dataEntryFormHtml:any = '<table border="1px"><form #dataEntryForm="ngForm" class="text-center dynamic-program-form">';
		for(let de of dataElements){
			dataEntryFormHtml += "<tr><td>" + de.name + "</td>";
			for(let optionCombo of de.optionCombos){
				dataEntryFormHtml += "<td><span [innerHTML]=\"changedValue\"></span><input [value]=value (ngModelChange)=\"changedValue = $event\" name=\"" + optionCombo.id + "\" [(ngModel)]=\"" + optionCombo.id + "\"/></td>";
			}
			dataEntryFormHtml += "</tr>";
		}

		dataEntryFormHtml += "</form></table>";
		return dataEntryFormHtml;
	}
	createDataOperandsFormArray(dataElementOperands,dataElements){
		let dataElementFormArray: any = [];
		if(!isUndefined(dataElementOperands)){

			for(let dataElement of dataElements){
				let filteredArray = this.filterDataElementFromOperands(dataElementOperands.dataElementOperands,dataElement.dataElement.id);

				dataElementFormArray.push({id:dataElement.dataElement.id,name:dataElement.dataElement.name,optionCombos: filteredArray });
			}
		}
		return dataElementFormArray;

	}
	filterDataElementFromOperands(dataElementOperands, dataElement){
		let dataElementArray: any = [];
		for(let de of dataElementOperands){
			if(de.dataElementId === dataElement){
				dataElementArray.push(de);
			}
		}
		return dataElementArray;
	}

	/**
	Get Cycles by Zone for a warehouse
	**/
	getZoneCycles(optionSets,filterCode){
		let zoneCycleOptions: any = {};
		if(!isUndefined(optionSets)){
			for(let optionSet of optionSets){
				if((optionSet.code).indexOf(filterCode) > -1){
					zoneCycleOptions = optionSet;
				}
			}
		}
		return zoneCycleOptions;
	}

	/** Get cycle deadline for a given zone
	**/
	getCycleDeadlineByZone(cyclesOptions,zone,cycle){
		let deadlines:any = [];
		for(let cycleOption of cyclesOptions){

			let cycleSplit = (cycleOption.code).split('[');
			let cycleDeadline = (cycleOption.name).split('[');
			let fy = (((cycleOption.name).split('FY')[1]).trim()).replace(']','');
			let trimmedCycle = (cycleSplit[0]).trim();
			let trimmedZone = (cycleSplit[1]).trim();


			if(((trimmedCycle.indexOf(cycle)) > -1) && ((trimmedZone.indexOf(zone)) > -1)){
				deadlines.push({
					date: moment(cycleDeadline[0].trim()).format('YYYY-MM-DD'),
					zone: zone,
					fy:  fy,
					cycle: cycle
				});
			}
		}

		return deadlines;
	}

	/**
	Use current year to determine the current financial year
	**/
	getDeadlineDate(deadlines){
		let currentYear = moment().format('YYYY');

		for(let deadline of deadlines){
			let deadlineFy = (deadline.fy).split('/');

			if((deadlineFy[1] === currentYear) || ((deadlineFy[1]) -1) === parseInt(currentYear)){
				return deadline;
			}
		}
	}
	/**
		Create categoryOptionCombos from categories to honor sorting order

	**/
	createVirtualCategoryOptionCombos(categories){
		let cocArray: any = [];
		if(!isNullOrUndefined(categories)){
			(categories.reverse()).forEach( (category,index) =>{
				if(!isNullOrUndefined(category[index].items)){
					for(let item of category[index].items){
						if(!isNullOrUndefined(item)){
							for(let itemX of category[index-1].items){
								let optionComboName: any = item.name + ", "+ itemX.name;
								cocArray.push({ "name":category.name,"id":category.id,"optionComboName": optionComboName });
							}
						}
					}
				}
			});
		}
		return cocArray;
	}
	
	createCategoryComboFormGroup(categoryCombos:any){
      return this.createDataElementFormGroup(categoryCombos);
    }
    createDataElementFormGroup(dataElements:any){
      let dataElementFormGroup: any = {};
      for(let dataElement of dataElements){
        dataElementFormGroup[dataElement.id] = this.createDataElementOptionComboFormGroup(dataElement.optionCombos);
      }
      return this.fb.group(dataElementFormGroup);
    }

    createDataElementOptionComboFormGroup(optionCombos:any){
      let optionComboFormGroup: any = {};
      for(let optionCombo of optionCombos){
        optionComboFormGroup[optionCombo.id] = this.createDataElementOptionFormGroup(optionCombo.options);
      }
      return this.fb.group(optionComboFormGroup);
    }

    createDataElementOptionFormGroup(options:any) {
          let t:any = {};
          for (let option of options){

           //t[option.id] = [{value:'',disabled:option.disabled}];
           t[option.id] = [{value:'',disabled: false }];
          }
          return this.fb.group(t);

      }
}
