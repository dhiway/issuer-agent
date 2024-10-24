export function processServiceData(serviceData: any) {
  const { id, type, serviceEndpoint } = serviceData;

  return [{
    id: id || 'default-id', 
    type: Array.isArray(type) ? type : [type], 
    serviceEndpoint: serviceEndpoint?.instance || [], 
  }];
}
