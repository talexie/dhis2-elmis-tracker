import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs';
import { Constants } from ".";
import { isUndefined, isNullOrUndefined } from 'util';

@Injectable()
export class OrgUnitService {

  nodes: any[] = null;
  constructor(
    private http: HttpClient,
    private constant: Constants) { }

  //sorting an array of object
  sortArrOfObjectsByParam (arrToSort: Array<any>, strObjParamToSortBy: string, sortAscending: boolean = true) {
    if( sortAscending == undefined ) sortAscending = true;  // default to true

    if( sortAscending ) {
      arrToSort.sort( function ( a, b ) {
        if( a[strObjParamToSortBy] > b[strObjParamToSortBy] ){
          return 1;
        }else{
          return -1;
        }
      });
    }
    else {
      arrToSort.sort(function (a, b) {
        if( a[strObjParamToSortBy] < b[strObjParamToSortBy] ){
          return 1;
        }else {
          return -1
        }
      });
    }
  }

  prepareOrganisationUnitTree(organisationUnit,type:string='top') {
        if (type == "top"){
          if (organisationUnit.children) {
            organisationUnit.children.sort((a, b) => {
              if (a.name > b.name) {
                return 1;
              }
              if (a.name < b.name) {
                return -1;
              }
              // a must be equal to b
              return 0;
            });
            organisationUnit.children.forEach((child) => {
              this.prepareOrganisationUnitTree(child,'top');
            })
          }
        }
        else{
            //console.log("Org Units",organisationUnit)
            organisationUnit.forEach((orgunit) => {
            //console.log(orgunit);
            if (orgunit.children) {
              orgunit.children.sort((a, b) => {
                if (a.name > b.name) {
                  return 1;
                }
                if (a.name < b.name) {
                  return -1;
                }
                // a must be equal to b
                return 0;
              });
              orgunit.children.forEach((child) => {
                this.prepareOrganisationUnitTree(child,'top');
              })
            }
          });
        }
    }
  // Get current user information
  getUserInformation () {
    return this.http.get(this.constant.ROOTURL + 'api/me.json?fields=dataViewOrganisationUnits[id,level],organisationUnits[id,level]');
  }
  // Get current user authorities
  getUserAuthorities () {
    return this.http.get(this.constant.ROOTURL + 'api/me.json?fields=id,name,email,phoneNumber,userCredentials[id,username,userRoles[id,name,authorities]]');
  }

  getuserOrganisationUnitsWithHighestlevel(level,userOrgunits){
    let orgunits = [];
    if(userOrgunits.dataViewOrganisationUnits.length == 0){
      userOrgunits.organisationUnits.forEach((orgunit) => {
        if ( orgunit.level == level ){
          orgunits.push(orgunit.id);
        }
      })
    }else{
      level = userOrgunits.dataViewOrganisationUnits[0].level;
      userOrgunits.dataViewOrganisationUnits.forEach((orgunit) => {
        if ( orgunit.level == level ){
          orgunits.push(orgunit.id);
        }
      })
    }
    return orgunits;
  }

  getUserHighestOrgUnitlevel(userOrgunits){
    let level: any;
    let orgunits = [];
    if(userOrgunits.dataViewOrganisationUnits.length == 0){
      level = userOrgunits.organisationUnits[0].level;
      userOrgunits.organisationUnits.forEach((orgunit) => {
        if ( orgunit.level <= level ){
          level = orgunit.level;
        }
      })
    }else{
      level = userOrgunits.dataViewOrganisationUnits[0].level;
      userOrgunits.dataViewOrganisationUnits.forEach((orgunit) => {
        if ( orgunit.level <= level ){
          level = orgunit.level;
        }
      })
    }
    return level;
  }

  prepareOrgunits(){
    this.getOrgunitLevelsInformation()
      .subscribe(
        (data: any) => {
          this.getUserInformation().subscribe(
            (userOrgunit: any) => {
              let level = this.getUserHighestOrgUnitlevel(userOrgunit);
              let all_levels = data.pager.total;
              let orgunits = this.getuserOrganisationUnitsWithHighestlevel(level,userOrgunit);
              let use_level = parseInt(all_levels) - (parseInt(level) - 1);
              let fields = this.generateUrlBasedOnLevels(use_level);
              this.getAllOrgunitsForTree1(fields, orgunits).subscribe(
                (items: any) => {
                  //noinspection TypeScriptUnresolvedVariable
                  this.nodes = items.organisationUnits;
                }
              )
            }
          )
        }
      );
  }


  // Generate Organisation unit url based on the level needed
  generateUrlBasedOnLevels (level){
    let childrenLevels = "[]";
    for (let i = 1; i < level+1; i++) {
      childrenLevels = childrenLevels.replace("[]", "[id,name,children[]]")
    }
    let new_string = childrenLevels.substring(1);
    new_string = new_string.replace(",children[]]","");
    return new_string;
  }

  // Get system wide settings
  getOrgunitLevelsInformation () {
    return this.http.get(this.constant.ROOTURL + 'api/organisationUnitLevels.json?fields=id');
  }

  // Get system wide settings
  getAllOrgunitsForTree (fields) {
    return this.http.get(this.constant.ROOTURL + 'api/organisationUnits.json?filter=level:eq:1&paging=false&fields=' + fields);
  }

  // Get orgunit for specific
  getAllOrgunitsForTree1 (fields,orgunits) {
    return this.http.get(this.constant.ROOTURL + 'api/organisationUnits.json?fields=' + fields +'&filter=id:in:['+orgunits.join(",")+']&paging=false');
  }

  // Get initial organisation units to speed up things during loading
  getInitialOrgunitsForTree (orgunits) {
    return this.http.get(this.constant.ROOTURL + 'api/organisationUnits.json?fields=id,name,children[id,name]&filter=id:in:['+orgunits.join(",")+']&paging=false');
  }
  getOrgUnitGroupSets () {
      return this.http.get(this.constant.ROOTURL + "api/organisationUnitGroupSets.json?fields=id,name,organisationUnitGroups[id,name,code],attributeValues[value,attribute[id,code]]&paging=false");
  }
  getOrgUnitGroupByAttribute (orgUnitGroups, attribute,version) {
      for (let orgUnitGroup of orgUnitGroups) {
        if(version === "2.27"){
          if ((!isNullOrUndefined(orgUnitGroup)) && (!isNullOrUndefined(orgUnitGroup.groupSets))){
            for (let orgUnitGroupSet of orgUnitGroup.groupSets)
            {
              if((!isNullOrUndefined(orgUnitGroupSet)) && (!isNullOrUndefined(orgUnitGroupSet.attributeValues))){
                for(let orgUnitGroupAttribute of orgUnitGroupSet.attributeValues){
                  if ((orgUnitGroupAttribute.attribute.code === attribute) && (orgUnitGroupAttribute.value === "true")){
                    return orgUnitGroup;
                  }
                }
              }
            }
          }
        }
        else{
          if ((!isNullOrUndefined(orgUnitGroup)) && (!isNullOrUndefined(orgUnitGroup.organisationUnitGroupSet)) && (!isNullOrUndefined(orgUnitGroup.organisationUnitGroupSet.attributeValues))){
            for (let orgUnitGroupAttribute of orgUnitGroup.organisationUnitGroupSet.attributeValues)
            {
              if((!isNullOrUndefined(orgUnitGroupAttribute)) && (!isNullOrUndefined(orgUnitGroupAttribute.attribute))){
                if ((orgUnitGroupAttribute.attribute.code === attribute) && (orgUnitGroupAttribute.value === "true")){
                  return orgUnitGroup;
                }
              }
            }
          }
        }

      }

  }
  getOrgUnitGroups () {
      return this.http.get(this.constant.ROOTURL + "api/organisationUnitGroups.json?fields=id,name,code,attributeValues[value,attribute[id,code]]&paging=false");
  }
  /** Get orgUnitGroupSet from OrgUnitGroupSets
  **/

  getSpecialOrgUnitGroupSetByAttribute(orgUnitGroups, attribute:string,specialOrder:string,typeOfAttribute:string) {
      for (let orgUnitGroup of orgUnitGroups) {
          if ((!isNullOrUndefined(orgUnitGroup)) && (!isNullOrUndefined(orgUnitGroup.organisationUnitGroupSet)) && (!isNullOrUndefined(orgUnitGroup.organisationUnitGroupSet.attributeValues))){
            for (let orgUnitGroupAttribute of orgUnitGroup.organisationUnitGroupSet.attributeValues)
            {
              if((!isNullOrUndefined(orgUnitGroupAttribute)) && (!isNullOrUndefined(orgUnitGroupAttribute.attribute))){
               let value = orgUnitGroupAttribute.value;

                if ((orgUnitGroupAttribute.attribute.code === attribute) && (value.indexOf(typeOfAttribute) > -1) && (specialOrder.indexOf(typeOfAttribute) >-1)){
                  return orgUnitGroup;
                }
              }
            }
          }
      }
  }


  /**
   Get orgUnit Group for special Ordering - TB
 **/
 getSpecialOrgUnitGroupByAttribute(orgUnitGroups, attribute:string, specialOrder:string,typeOfAttribute:string) {
      for (let orgUnitGroup of orgUnitGroups) {
          if ((!isNullOrUndefined(orgUnitGroup)) && (!isNullOrUndefined(orgUnitGroup.attributeValues))){
            for (let orgUnitGroupAttribute of orgUnitGroup.attributeValues)
            {
              if((!isNullOrUndefined(orgUnitGroupAttribute)) && (!isNullOrUndefined(orgUnitGroupAttribute.attribute))){
                let value = orgUnitGroupAttribute.value;

                if ((orgUnitGroupAttribute.attribute.code === attribute) && (value.indexOf(typeOfAttribute) > -1) && (specialOrder.indexOf(typeOfAttribute) >-1)){
                  return orgUnitGroup;
                }
              }
            }
          }
       }

   }
  /**
  Keep the last two words for the zones e.g TB NMS Zone 4 becomes Zone 4 in display
  **/
  formatDeliveryZone(zone){
    if(!isNullOrUndefined(zone)){
        let splitZone = (zone.name).split(' ');
        zone.value = splitZone[splitZone.length -2]  + ' ' + splitZone[splitZone.length -1];
     }
   return zone;
  }

  // Handling error
  handleError (error: any) {
    return Observable.throw( error );
  }


}
