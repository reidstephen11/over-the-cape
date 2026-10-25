import type * as THREE from 'three';
import type {VehicleTuning} from '../data/vehicle';
import {buildVehicleBody as body} from './vehicleBody';
import {buildVehicleWheel as wheel} from './vehicleWheel';
import {camelLivery,camelRim,addCamelTrophyKit} from './camelLivery';
export function buildVehicleBody(t:VehicleTuning,w:THREE.BufferGeometry):THREE.BufferGeometry{return body(t,w,camelLivery,{aerialSide:1,add:addCamelTrophyKit});}
export function buildVehicleWheel(t:VehicleTuning):THREE.BufferGeometry{return wheel(t,camelRim);}
