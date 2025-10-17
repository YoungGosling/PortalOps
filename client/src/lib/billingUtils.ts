import { WebService, ServiceProduct, ProductBillingInfo } from '../types'

export function getIncompleteProductsCount(services: WebService[]): number {
  let incompleteCount = 0
  
  services.forEach(service => {
    service.products.forEach(product => {
      if (!isProductBillingComplete(product)) {
        incompleteCount++
      }
    })
  })
  
  return incompleteCount
}

export function isProductBillingComplete(product: ServiceProduct): boolean {
  if (!product.billingInfo) {
    return false
  }
  
  const billing = product.billingInfo
  return !!(
    billing.billAmount &&
    billing.cardholderName &&
    billing.expirationDate &&
    billing.paymentMethod
  )
}

export function getAllProductsWithBilling(services: WebService[]): Array<{
  service: WebService
  product: ServiceProduct
  isComplete: boolean
}> {
  const products: Array<{
    service: WebService
    product: ServiceProduct
    isComplete: boolean
  }> = []
  
  services.forEach(service => {
    service.products.forEach(product => {
      products.push({
        service,
        product,
        isComplete: isProductBillingComplete(product)
      })
    })
  })
  
  // Sort incomplete products first
  return products.sort((a, b) => {
    if (a.isComplete === b.isComplete) return 0
    return a.isComplete ? 1 : -1
  })
}

export function createEmptyBillingInfo(productId: string): ProductBillingInfo {
  return {
    id: `billing-${productId}-${Date.now()}`,
    productId,
    billAmount: undefined,
    cardholderName: undefined,
    expirationDate: undefined,
    paymentMethod: undefined,
    isComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
