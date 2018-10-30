using System;
using System.Globalization;
using Umbraco.Core;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors;
using umbraco_v7_property_editors_gmaps.Models;

namespace umbraco_v7_property_editors_gmaps.ValueConverters
{
    [PropertyValueType(typeof(GMapsLocation))]
    public class GMapsValueConverter : PropertyValueConverterBase
    {
        public override bool IsConverter(PublishedPropertyType propertyType)
        {
            return "Netaddicts.GMaps".Equals(propertyType.PropertyEditorAlias);
        }

        public override object ConvertDataToSource(PublishedPropertyType propertyType, object source, bool preview)
        {
            var convertAttempt = source.TryConvertTo<string>();
            if (convertAttempt.Success)
            {
                return convertAttempt.Result;
            }
            return null;
        }

        public override object ConvertSourceToObject(PublishedPropertyType propertyType, object source, bool preview)
        {
            if (source == null || string.IsNullOrWhiteSpace(source.ToString()))
            {
                return null;
            }

            string[] coordinates = source.ToString().Split(new[] { "," }, StringSplitOptions.RemoveEmptyEntries);
            
            decimal lat, lng;
            if (coordinates.Length == 2 &&
                decimal.TryParse(coordinates[0], NumberStyles.Number, CultureInfo.InvariantCulture, out lat) && 
                decimal.TryParse(coordinates[1], NumberStyles.Number, CultureInfo.InvariantCulture, out lng))
            {
                return new GMapsLocation
                {
                    Latitude = lat,
                    Longitude = lng
                };
            }

            return null;
        }
    }
}