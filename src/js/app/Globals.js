// define a module which contains an Object (not a class)
define(
    ['esri/layers/ImageryLayer', 'esri/layers/TileLayer'],
    function (ImageryLayer, TileLayer) {
        // variables are private due to closure and only accessible via the functions in the returned object.
        var _name = 'Grid Extract';

        const crm_hillshade = new ImageryLayer({
            id: 'crm',
            url: "https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer",
            renderingRule: {
                functionName: "ColorHillshade"
            },
            mosaicRule: {
                // eslint-disable-next-line quotes
                where: "DemName='U.S. Coastal Relief Model'"
            },
            visible: false
        });

        const greatlakes_hillshade = new ImageryLayer({
            id: 'great_lakes',
            url: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer',
            renderingRule: {
                functionName: 'ColorHillshade'
            },
            mosaicRule: {
                // eslint-disable-next-line quotes
                where: "name='greatlakes_lakedatum'"
            },
            visible: false
        });

        const alaska_hillshade = new ImageryLayer({
            id: 'alaska',
            url: "https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer",
            renderingRule: {
                functionName: "ColorHillshade"
            },
            mosaicRule: {
                where: "name='so_ak_crm_v2_180to180'"
            },
            visible: false
        });

        const socal_1as_hillshade = new ImageryLayer({
            id: 'socal_1as',
            url: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer',
            renderingRule: {
                functionName: "ColorHillshade"
            },
            mosaicRule: {
                where: "name='socal_1as'"
            },
            visible: false
        });

        const socal_3as_hillshade = new ImageryLayer({
            id: 'socal_3as',
            url: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer',
            renderingRule: {
                functionName: "ColorHillshade"
            },
            mosaicRule: {
                where: "name='socal_3as'"
            },
            visible: false
        });

        const etopo1_hillshade = new TileLayer({
            id: 'etopo1',
            url: 'https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/ETOPO1_Global_Relief_Model_Color_Shaded_Relief/MapServer',
            visible: false
        });

        // essentially the public API
        return {
            getName: function () {
                return _name;
            },

            getMapLayers: function () {
                return ([crm_hillshade, etopo1_hillshade, greatlakes_hillshade, socal_1as_hillshade, socal_3as_hillshade, alaska_hillshade]);
            }
        };
    });
