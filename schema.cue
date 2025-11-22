// schema.cue
// ServedUp AI – Firestore-oriented schema
package servedup

// -----------------------------------------------------------------------------
// Common helpers
// -----------------------------------------------------------------------------

#ID:        string   // Firestore document ID (usually auto-generated)
#Timestamp: string   // Store as Firestore Timestamp in code; CUE uses string
#Money:     number & >=0
#Quantity:  number

// -----------------------------------------------------------------------------
// Collection layout (for reference)
// -----------------------------------------------------------------------------
//
// accounts                           -> #BusinessAccount
// accounts/{accountId}/users         -> #User
// accounts/{accountId}/customers     -> #Customer
// accounts/{accountId}/products      -> #Product
// accounts/{accountId}/orders        -> #Order
// accounts/{accountId}/orders/{id}/lineItems -> #OrderLineItem
// accounts/{accountId}/suppliers     -> #SupplierTransaction
// accounts/{accountId}/inventoryEvents -> #InventoryEvent
// accounts/{accountId}/messages      -> #Message
// accounts/{accountId}/campaigns     -> #Campaign
// accounts/{accountId}/loyaltyEvents -> #LoyaltyEvent
// accounts/{accountId}/locations     -> #Location
// accounts/{accountId}/locationPings -> #LocationPing
// accounts/{accountId}/profitSnapshots -> #ProfitSnapshot
//
// You can keep `accountId` inside each doc for easier querying / Cloud Functions,
// even though it’s also encoded in the collection path.

// -----------------------------------------------------------------------------
// Core business objects
// -----------------------------------------------------------------------------

// Root collection: accounts
#BusinessAccount: {
    // id is the Firestore document ID for /accounts/{id}
    id:               #ID
    name:             string
    legalName?:       string
    email?:           string
    phone?:           string

    address1?:        string
    address2?:        string
    city?:            string
    state?:           string
    postalCode?:      string
    county?:          string
    country?:         string

    subscriptionTier: *"mvp" | "growth" | "pro" | "custom"
    subscriptionStatus: *"trial" | "active" | "past_due" | "canceled"
    subscriptionStartAt?: #Timestamp
    subscriptionEndAt?:   #Timestamp

    createdAt:        #Timestamp
    updatedAt:        #Timestamp
}

// /accounts/{accountId}/users
#User: {
    id:         #ID
    accountId:  #ID

    role: *"owner" | "manager" | "staff" | "admin"
    email:      string
    phone?:     string
    firstName:  string
    lastName?:  string

    isEmployee: bool

    status: *"invited" | "active" | "disabled"

    authProvider?:  *"password" | "magic_link" | "oauth" | "sso"
    authSubjectId?: string

    lastLoginAt?: #Timestamp
    createdAt:    #Timestamp
    updatedAt:    #Timestamp
}

// /accounts/{accountId}/customers
#Customer: {
    id:         #ID
    accountId:  #ID

    name?:      string
    phone?:     string
    email?:     string
    notes?:     string

    preferredChannel?: *"sms" | "whatsapp" | "instagram_dm" | "none"
    marketingOptIn:    bool

    createdAt:  #Timestamp
    updatedAt:  #Timestamp
}

// -----------------------------------------------------------------------------
// Menu, inventory, suppliers
// -----------------------------------------------------------------------------

// /accounts/{accountId}/products
#Product: {
    id:         #ID          // maps to your USID
    accountId:  #ID

    name:       string
    description?: string

    category?:   string
    menuType?:  *"food" | "drink" | "merch" | "service"

    sku?:       string
    isActive:   bool

    price:      #Money       // sell price
    cost?:      #Money       // per-unit cost

    currentStock?:     #Quantity
    stockUnit?:       *"each" | "lb" | "oz" | "liter" | "pack"
    prepTimeSeconds?: number  // PrepTimeEst

    createdAt:  #Timestamp
    updatedAt:  #Timestamp
}

// /accounts/{accountId}/suppliers
#SupplierTransaction: {
    id:               #ID
    accountId:        #ID

    supplierName:     string
    transactionDate:  #Timestamp

    totalAmount:      #Money
    currency?:        string

    transactionType: *"inventory" | "equipment" | "fees" | "other"

    receiptImageUrl?: string
    ocrText?:         string

    notes?:           string

    createdAt:        #Timestamp
    updatedAt:        #Timestamp
}

// /accounts/{accountId}/inventoryEvents
#InventoryEvent: {
    id:         #ID
    accountId:  #ID
    productId:  #ID

    type: *"purchase" | "sale" | "waste" | "adjustment"
    quantityDelta:  #Quantity
    unitCost?:      #Money

    supplierTransactionId?: #ID

    reason?:      string
    occurredAt:   #Timestamp

    createdAt:    #Timestamp
    updatedAt:    #Timestamp
}

// -----------------------------------------------------------------------------
// Orders & line items
// -----------------------------------------------------------------------------

// /accounts/{accountId}/orders
#Order: {
    id:         #ID
    accountId:  #ID
    customerId?: #ID

    channel: *"sms" | "web_form" | "qr_code" | "in_person" | "phone" | "other"

    status: *"pending" | "accepted" | "preparing" | "ready" | "completed" | "canceled" | "refunded"

    placedAt:          #Timestamp
    acceptedAt?:       #Timestamp
    readyAt?:          #Timestamp
    completedAt?:      #Timestamp
    canceledAt?:       #Timestamp

    prepTimeEstimateSeconds?: number
    prepTimeActualSeconds?:   number

    locationId?: #ID

    subtotalAmount:   #Money
    taxAmount?:       #Money
    discountAmount?:  #Money
    totalAmount:      #Money

    currency?:        string
    paymentStatus:   *"unpaid" | "paid" | "refunded" | "partial"
    paymentMethod?:  *"cash" | "card" | "zelle" | "cashapp" | "venmo" | "other"

    notes?:           string

    createdAt:        #Timestamp
    updatedAt:        #Timestamp
}

// /accounts/{accountId}/orders/{orderId}/lineItems
#OrderLineItem: {
    id:         #ID
    orderId:    #ID
    accountId:  #ID
    productId:  #ID

    quantity:      #Quantity
    unitPrice:     #Money
    lineSubtotal:  #Money

    status: *"pending" | "preparing" | "ready" | "served" | "canceled"
    specialInstructions?: string

    createdAt:  #Timestamp
    updatedAt:  #Timestamp
}

// -----------------------------------------------------------------------------
// Messaging, marketing, loyalty
// -----------------------------------------------------------------------------

// /accounts/{accountId}/messages
#Message: {
    id:         #ID
    accountId:  #ID
    userId?:    #ID
    customerId?: #ID

    direction: *"outbound" | "inbound"
    channel:  *"sms" | "whatsapp" | "instagram_dm" | "other"

    purpose: *"order_update" | "promo" | "loyalty" | "support" | "other"
    templateKey?: string

    body:       string

    status: *"queued" | "sending" | "sent" | "delivered" | "failed"
    providerMessageId?: string

    sentAt?:      #Timestamp
    deliveredAt?: #Timestamp
    failedAt?:    #Timestamp

    createdAt: #Timestamp
    updatedAt: #Timestamp
}

// /accounts/{accountId}/campaigns
#Campaign: {
    id:         #ID
    accountId:  #ID

    name:       string
    description?: string

    type: *"promo" | "loyalty" | "announcement"
    channel: *"sms" | "whatsapp" | "email" | "multi"

    status: *"draft" | "scheduled" | "active" | "completed" | "canceled"

    scheduledAt?: #Timestamp
    startedAt?:   #Timestamp
    completedAt?: #Timestamp

    targetAllCustomers: bool
    tagFilter?: [string]

    createdAt: #Timestamp
    updatedAt: #Timestamp
}

// /accounts/{accountId}/loyaltyEvents
#LoyaltyEvent: {
    id:         #ID
    accountId:  #ID
    customerId: #ID

    orderId?:   #ID

    type: *"signup" | "points_earned" | "points_spent" | "reward_redeemed" | "tier_change" | "adjustment"
    pointsDelta: number

    description?: string
    occurredAt:  #Timestamp

    createdAt: #Timestamp
    updatedAt: #Timestamp
}

// -----------------------------------------------------------------------------
// Locations & tracking
// -----------------------------------------------------------------------------

// /accounts/{accountId}/locations
#Location: {
    id:         #ID
    accountId:  #ID

    name:       string
    description?: string

    address1?:  string
    address2?:  string
    city?:      string
    state?:     string
    postalCode?: string
    country?:   string

    latitude?:  number
    longitude?: number

    isTruckLocation: bool

    createdAt: #Timestamp
    updatedAt: #Timestamp
}

// /accounts/{accountId}/locationPings
#LocationPing: {
    id:         #ID
    accountId:  #ID
    locationId?: #ID

    latitude:   number
    longitude:  number

    source: *"gps" | "manual" | "import"
    recordedAt: #Timestamp

    createdAt: #Timestamp
    updatedAt: #Timestamp
}

// -----------------------------------------------------------------------------
// Analytics / reporting
// -----------------------------------------------------------------------------

// /accounts/{accountId}/profitSnapshots
#ProfitSnapshot: {
    id:         #ID
    accountId:  #ID

    granularity: *"day" | "event" | "custom"
    label?:      string

    startAt:     #Timestamp
    endAt:       #Timestamp

    grossSales:      #Money
    discounts:       #Money
    refunds:         #Money
    netSales:        #Money
    costOfGoodsSold: #Money
    otherExpenses:   #Money
    profit:          #Money

    generatedAt: #Timestamp
    createdAt:   #Timestamp
    updatedAt:   #Timestamp
}

