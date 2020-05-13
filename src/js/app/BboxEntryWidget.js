define([
    'dojo/_base/declare',
    'dojo/Evented',
    'dojo/_base/lang',
    'dijit/_TemplatedMixin', 
    'dijit/_WidgetBase',
    'dojo/topic',
    'dojo/text!./templates/BboxEntryWidget.html',
    'esri/geometry/Extent'],
    function(
        declare,
        Evented,
        lang,
        _TemplatedMixin, 
        _WidgetBase,
        topic,
        widgetTemplate,
        Extent
    ){
        return declare([_WidgetBase, _TemplatedMixin, Evented], {
            // Widget's HTML template
            templateString: widgetTemplate,

            // default options
            options: {
                topicName: "bbox/change"
            },

            // CSS class to be applied to the root node in our template
            baseClass: 'BboxEntryWidget',


            constructor: function(options, srcRefNode) {
                var defaults = lang.mixin({}, this.options, options);
                this.domNode = srcRefNode;

                // name used by topic when publishing results
                this.set("topicName", defaults.topicName);
            },


            initDialog: function(coordString) {
                let coords = coordString.split(', ');
                if (! coordString || coords.length < 4) {
                    // not necessarily an error
                    return;
                }
                this._westInput.value = coords[0];
                this._southInput.value = coords[1];
                this._eastInput.value = coords[2];
                this._northInput.value = coords[3];
                
                this.validateInput();
            },


            validateInput() {
                // need numbers to faciliate range checking
                let minx = parseFloat(this._westInput.value)
                let miny = parseFloat(this._southInput.value)
                let maxx = parseFloat(this._eastInput.value)
                let maxy = parseFloat(this._northInput.value)

                if (isNaN(minx) || isNaN(maxx) || minx < -180 || maxx > 180 || minx >= maxx) {
                    // console.error("Longitude values must be between -180 and 180");
                    this.enableSaveButton(false);
                    return false
                }
                if (isNaN(miny) || isNaN(maxy) || miny < -90 || maxy > 90 || miny >= maxy) {
                    // console.error("Latitude values must be between -90 and 90");
                    this.enableSaveButton(false);
                    return false
                }
                this.extent = new Extent({xmin: minx, ymin: miny, xmax: maxx, ymax: maxy});
                this.enableSaveButton(true);
                return true
            },


            saveBtnHandler() {
                // validate again in case input changed w/o losing focus and triggering onchange event
                if (this.validateInput()) {
                    topic.publish(this.topicName, this.extent);
                }
            },


            enableSaveButton(enable=true) {
                // add/remove HTML data attribute to work around inability to programatically close dialog
                if (enable) {
                    this._saveButton.dataset.dismiss = 'modal';
                    this._saveButton.classList.remove("disabled");                
                } else {
                    this._saveButton.dataset.dismiss = '';
                    this._saveButton.classList.add("disabled");
                }
            }
            




        });
    });
