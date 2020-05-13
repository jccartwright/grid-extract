define([
    'dojo/_base/declare',
    'dojo/Evented',
    'dojo/_base/lang',
    'dijit/_TemplatedMixin', 
    'dijit/_WidgetBase',
    'dojo/topic',
    'esri/Graphic', 
    'esri/geometry/Extent', 
    'esri/geometry/support/webMercatorUtils',
    'dojo/text!./templates/CoordinatesTool.html'],
    function(
        declare,
        Evented,
        lang,
        _TemplatedMixin, 
        _WidgetBase,
        topic,
        Graphic,
        Extent,
        webMercatorUtils,
        widgetTemplate
    ){
        return declare([_WidgetBase, _TemplatedMixin, Evented], {
            // Widget's HTML template
            templateString: widgetTemplate,

            // default options
            options: {
            },

            // CSS class to be applied to the root node in our template
            baseClass: 'CoordinatesTool',

            //
            // Widget lifecycle methods. defined in the order in which they are called
            //
            constructor: function(options, srcRefNode) {
                var defaults = lang.mixin({}, this.options, options);
                this.domNode = srcRefNode;
                this.set("view", options.mapView);
            },

            
            postCreate: function() {
                // assume we are overridng a method that may do something in a class up the inheritance chain
                this.inherited(arguments);

                // taken from Esri example https://developers.arcgis.com/javascript/latest/guide/get-map-coordinates/
                this.view.watch(["stationary"], function() {
                    this.showCoordinates(this.view.center);
                }.bind(this));
            
                this.view.on(["pointer-down","pointer-move"], function(evt) {
                    this.showCoordinates(this.view.toMap({ x: evt.x, y: evt.y }));
                }.bind(this));

                this.view.on(["pointer-leave"], function(evt){
                    this._coordsDiv.textContent = "not available";
                }.bind(this));
            },


            startup: function() {
            // fires automatically when added to view UI
                if (! this.view) {
                    this.destroy();
                    console.error("CoordinatesTool::a MapView instance must be provided");
                }
            },


            //
            // utility methods
            //
            showCoordinates: function(point) {
                const coords = "Lat/Lon " + point.latitude.toFixed(3) + " " + point.longitude.toFixed(3);
                // const coords = `Lat/Lon ${point.latitude.toFixed(3)} ${point.longitude.toFixed(3)} | Scale 1:${Math.round(this.view.scale * 1) / 1} | Zoom ${this.view.zoom}`;
                this._coordsDiv.textContent = coords;                
            }
        });
    });
