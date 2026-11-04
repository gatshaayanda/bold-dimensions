export const SERVICE_AREAS = [
 { id:"agricultural-machinery", name:"Agricultural machinery", short:"Machinery", intro:"Support requests for tractors and agricultural equipment.", options:["Tractor servicing","Machinery repair","Diagnostics","Parts enquiry","Other machinery support"] },
 { id:"air-conditioning", name:"Air conditioning", short:"Air conditioning", intro:"Installation, servicing and fault support for air-conditioning systems.", options:["New installation","Routine servicing","Repair / fault finding","System assessment","Other air-conditioning support"] },
 { id:"solar-water-heating", name:"Solar water heating", short:"Solar water heating", intro:"Installation, maintenance and fault support for solar water-heating systems.", options:["New installation","Routine maintenance","Repair / fault finding","System assessment","Other solar water-heating support"] }
] as const;
export type ServiceAreaId = typeof SERVICE_AREAS[number]["id"];
export type ServiceRequestStatus = "New"|"Reviewing"|"Quote prepared"|"Awaiting customer"|"Scheduled"|"In progress"|"Completed"|"Cancelled";
export type ServiceRequest = { id:string; customerId:string; customerName:string; phone:string; email?:string; areaId:ServiceAreaId; serviceType:string; equipment?:string; makeModel?:string; location:string; description:string; urgency:"Standard"|"Urgent"; preferredContact:"WhatsApp"|"Phone"|"Email"; status:ServiceRequestStatus; createdAt:string; updatedAt:string; scheduledFor?:string; quoteAmount?:number; quoteNote?:string; internalNote?:string };
export const requestStatusSteps:ServiceRequestStatus[]=["New","Reviewing","Quote prepared","Awaiting customer","Scheduled","In progress","Completed"];
