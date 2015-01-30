using System;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors;
using System.Threading;

public class GMapsValueConverter : PropertyValueConverterBase
{
	public override bool IsConverter(PublishedPropertyType propertyType)
	{
		return "Netaddicts.GMaps".Equals(propertyType.PropertyEditorAlias);
	}

	public override object ConvertDataToSource(PublishedPropertyType propertyType, object source, bool preview)
	{
		if (source == null || string.IsNullOrWhiteSpace(source.ToString())) return null;

		var coordinates = source.ToString().Split(new[] { "," }, StringSplitOptions.RemoveEmptyEntries);

		Thread.CurrentThread.CurrentCulture = new System.Globalization.CultureInfo("en-US");

		return new GMapsLocation
			{
				Lat = decimal.Parse(coordinates[0], System.Globalization.NumberStyles.Any),
				Lng = decimal.Parse(coordinates[1], System.Globalization.NumberStyles.Any)
			};
	}
}