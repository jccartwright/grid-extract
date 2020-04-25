require([
    "dojo/topic",
    "esri/widgets/CoordinateConversion",
    "esri/widgets/Expand",
    "esri/widgets/Home",
    "esri/layers/ImageryLayer",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/support/MosaicRule",
    "esri/layers/support/RasterFunction",
    "app/DatasetSelectWidget",
    "app/DrawExtentTool",
    "app/Globals",
    "dojo/domReady"
], function (topic, CoordinateConversion, Expand, Home, ImageryLayer, Map, MapView, MosaicRule, RasterFunction, DatasetSelectWidget, DrawExtentTool, globals) {

    let bbox = null;

    console.log('my name is ' + globals.getName());

    document.getElementById("resetBtn").addEventListener('click', resetButtonHandler);

    var dem_all = new ImageryLayer({
        url: "https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer",
        renderingRule: {
            functionName: "ColorHillshade"
        }
    });

    // layer id must match dataset name
    var crm_hillshade = new ImageryLayer({
        id: 'crm',
        url: "https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer",
        renderingRule: {
            functionName: "ColorHillshade"
        },
        mosaicRule: {
            where: "DemName='U.S. Coastal Relief Model'"
        },
        visible: false
    });

    var map = new Map({
        basemap: "topo-vector",
        layers: [crm_hillshade]
    });
    
    var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-118.80500, 34.02700],
        zoom: 13
    });

    view.when(function() { 
        // tool to draw area of interest on map
        const drawExtentTool = new DrawExtentTool({
            mapView: view, 
            outlineColor: [0,0,0]
        }, 'drawExtentTool');
        // lifecycle method 'startup' called automatically when added to View UI
        view.ui.add(drawExtentTool, "top-left");

        const homeWidget = new Home({
            view: view
        });
        view.ui.add(homeWidget, "top-right");

        const coordinateDisplayWidget = new CoordinateConversion({
            container: document.createElement("div"),
            view: view
        });
        // view.ui.add(coordinateDisplayWidget, "bottom-left");

        coordinateDisplayExpand = new Expand({
            expandIconClass: "esri-icon-tracking",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
            view: view,
            content: coordinateDisplayWidget.domNode,
            expanded: false
          });
        view.ui.add(coordinateDisplayExpand, "bottom-left");
    })

    // doesn't need to wait for MapView or datafile to load
    const datasetSelectWidget = new DatasetSelectWidget({}, 'datasetSelectWidgetDiv');

    // do something with the area of interest
    topic.subscribe("aoi/change", function(){
        extent = arguments[0]
        console.log('area of interest set to: ', extentToString(extent));
        document.getElementById("bboxText").value = extentToString(extent,2);
        updateUrl();
    })

    // do something with change of dataset
    topic.subscribe("dataset/change", function(){
        dataset = arguments[0];
        updateUrl();
        togglePreviewLayers(dataset);
    })


    function resetButtonHandler(evt) {
        console.log('inside resetButtonHandler with ',evt);
        // TODO
        // clear graphics from map
        // reset dataset select
        // clear AOI text entry
    }


    function enableDownload(enable) {
        if (! enable) {
            document.getElementById("downloadBtn").classList.add("disabled");
        } else {
            document.getElementById("downloadBtn").classList.remove("disabled");
        }
    }


    function extentToString(extent, precision=4) {
        coords = [extent.xmin, extent.ymin, extent.xmax, extent.ymax].map(x => x.toFixed(precision));
        return(coords.join(', '));
    }


    function calculateCellCount(resolution, extent) {
		var res = globals.selectedLayer.resolution;
		var extent = globals.selectedExtent;
		var xDist = extent.xmax - extent.xmin;
		var yDist = extent.ymax - extent.ymin;
		var rows = Math.ceil(xDist / res);
		var cols = Math.ceil(yDist / res);
		return (rows * cols);
    }
    

    function updateUrl() {
        if (this.dataset && this.extent) { 
            // TODO validate values including calculating # cells and bbox crossing antimeridian
            enableDownload(true);
        } else {
            console.warn('both dataset and area of interest must be set');
            enableDownload(false);
        }
    }


    function togglePreviewLayers(layerId) {
        map.layers.forEach(function(layer){
            if (layer.id === layerId) {
                layer.visible = true;
            } else {
                layer.visible = false;
            }
        }) 
    }
});