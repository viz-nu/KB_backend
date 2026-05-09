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
    type Coordinate {
  lng: Float!
  lat: Float!
}
  type PointLocation {
  type: String!   # "Point"
  coordinates: Coordinate!
}
  type PolygonLocation {
  type: String!   # "Polygon"
  coordinates: [[Coordinate!]!]!
}
  type LineStringLocation {
  type: String!   # "LineString"
  coordinates: [Coordinate!]!
}
  input CoordinateInput {
  lng: Float!
  lat: Float!
}

input PointLocationInput {
  type: String!   # "Point"
  coordinates: CoordinateInput!
}

input PolygonLocationInput {
  coordinates: [[CoordinateInput!]!]!
}

input LineStringLocationInput {
  coordinates: [CoordinateInput!]!
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