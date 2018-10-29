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

            return new GMapsLocation
            {
                Latitude = decimal.Parse(coordinates[0], CultureInfo.InvariantCulture),
                Longitude = decimal.Parse(coordinates[1], CultureInfo.InvariantCulture)
            };
        }
    }
}