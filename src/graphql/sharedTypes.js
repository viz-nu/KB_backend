export const sharedTypeDefs = `#graphql
  """Custom scalar for handling dates and times"""
  scalar DateTime
  """Custom scalar for handling arbitrary JSON data"""
  scalar JSON
  type PaginationMetaData {
    page: Int
    limit: Int
    totalPages: Int
    totalDocuments: Int
  }
  type PointLocation {
  type: String!   # "Point"
  coordinates: [Float]!
}
  type PolygonLocation {
  type: String!   # "Polygon"
  coordinates: [[[Float]!]!]!
}
  type LineStringLocation {
  type: String!   # "LineString"
  coordinates: [[Float]!]!
}

input PointLocationInput {
  type: String!   # "Point"
  coordinates: [Float]!
}

input PolygonLocationInput {
  coordinates: [[[Float]!]!]!
}

input LineStringLocationInput {
  coordinates: [[Float]!]!
}
   enum MeasurementTypeEnum {
    number
    text
    select
    multiselect
    boolean
    table
    time
    phone
   }
    type Measurement {
        _id: ID
        key: String
        label: String
        unit: String
        type: MeasurementTypeEnum
        options: [String]
        columns: JSON
         billingRate: Int
         fixedNumber: Int
         fixedString: String
         requiresPhoto: Boolean
    }
        type Chapter {
        _id: ID
        name: String
        code: String
        color: String
        items: [Item]
    }
    type Item {
        _id: ID
        label: String
        code: String
        description: String
        measurements: JSON
    }
`;