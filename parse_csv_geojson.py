import csv
import json

from decimal import Decimal

with open('input2.csv', newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',', quotechar='|')
    
    with open('data.geojson', 'w', encoding='utf-8') as geojsonfile:
      
      result = {
        "type": "FeatureCollection",
        "features": []
      }
      
      for row in reader:
          if row[0] == 'school':
            continue
        
          # print(', '.join(row))
          # print(row)
          
          school = row[0].strip()
          school_type = row[1].strip()
          
          latitude = float(row[2].strip().removeprefix('"'))
          longitude = float(row[3].strip().removesuffix('"'))
          
          student_count = (row[4].strip())
          
          if student_count == 0:
            continue
          
          feature = {
            "type": "Feature",
            "properties": {
              "school": school,
              "school_type": school_type,
              "student_count": student_count 
            },
            "geometry": {
              "type": "Point",
              "coordinates": [longitude, latitude]
            }
          }
          
          result["features"].append(feature)
          
          print(school, school_type, latitude, longitude, student_count)
          
      json.dump(result, geojsonfile, ensure_ascii=False, indent=4)
        



    
 
