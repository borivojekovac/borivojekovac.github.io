app.gfx.Size=function(e,r){this.x=e;this.y=r;var n=this;var t=app.gfx.Driver.current.devicePixelRatio();this.setBrowser=function(e,r){n.x=Math.round(t*e)/app.gfx.Driver.current.screenSize.scale.x;n.y=Math.round(t*r)/app.gfx.Driver.current.screenSize.scale.y};this.getBrowserX=function(){return Math.round(app.gfx.Driver.current.screenSize.scale.x*n.x)/t};this.getBrowserY=function(){return Math.round(app.gfx.Driver.current.screenSize.scale.y*n.y)/t};this.getPhysicalX=function(){return Math.round(app.gfx.Driver.current.screenSize.scale.x*n.x)};this.getPhysicalY=function(){return Math.round(app.gfx.Driver.current.screenSize.scale.y*n.y)}};app.gfx.Size.getPhysicalX=function(e){return Math.round(app.gfx.Driver.current.screenSize.scale.x*e)};app.gfx.Size.getPhysicalY=function(e){return Math.round(app.gfx.Driver.current.screenSize.scale.y*e)};