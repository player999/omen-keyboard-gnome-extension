/**
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/

	// Made by Me := Fanelia
	// This extension put a menu item on the Status Menu that change the backlight keyboard light using clevo-xsm-wmi by tuxedo
	
	// Import St because is the library that allow you to create UI elements 
	const St = imports.gi.St;
	// Import Clutter because is the library that allow you to layout UI elements */
	const Clutter = imports.gi.Clutter;

	// Import Main because is the instance of the class that have all the UI elements
	// and we have to add to the Main instance our UI elements
	
	const Main = imports.ui.main;

	// Import tweener to do the animations of the UI elements 
	//const Tweener = imports.ui.tweener;

	
	//Import PanelMenu and PopupMenu 
	const PanelMenu = imports.ui.panelMenu;
	const PopupMenu = imports.ui.popupMenu;

 
	const Gio = imports.gi.Gio;
	const Gtk = imports.gi.Gtk;
	const GLib = imports.gi.GLib;
	const GObject = imports.gi.GObject;
	
    const Colors=["000000","FF0000","00FF00","0000FF","FFFF00","FF00FF","00FFFF","FFFFFF"]
	const ExtensionUtils = imports.misc.extensionUtils;
	const Me = ExtensionUtils.getCurrentExtension();
	
	// import own scripts
	const Convenience = Me.imports.convenience;                       

	// For compatibility checks, as described above
	const Config = imports.misc.config;
	const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

	const Slider = imports.ui.slider;

	//Import Lang because we will write code in a Object Oriented Manner

	const Lang = imports.lang;

	// GLobal vairables
	// UI Obj
	let sliderBright;
	// Variables
	let menuOpened,saveState,bs;
	let settings;
	let directory;
	
	// We're going to declare `indicator` in the scope of the whole script so it can
	// be accessed in both `enable()` and `disable()`
	var indicator = null;

	// We'll extend the Button class from Panel Menu so we can do some setup in
	// the init() function.
	var OmenKeyboard = class OmenKeyboard extends PanelMenu.Button {
		_init() {
			super._init(0.0, `${Me.metadata.name} Indicator`, false);
   
			// Pick an icon
			let icon = new St.Icon({gicon: new Gio.ThemedIcon({name: 'input-keyboard-symbolic'}),style_class: 'system-status-icon'});

			this.add_child(icon);

			// Created menu icon

			// This is a menu separator
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
			let label2 = new St.Label({text:'Brightness  ',y_expand: true,y_align: Clutter.ActorAlign.START });

			// Slider brightness
			let brightness = new PopupMenu.PopupMenuItem('');
			sliderBright = new Slider.Slider(bs);
			
			brightness.add(label2);
			brightness.add(sliderBright, {expand: true});
			brightness.style_class = 'ItemStyle';
			this.menu.addMenuItem(brightness);

			// This is a menu separator
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
			
			sliderBright.connect('notify::value', _onSliderBrightnessChanged);
		}	
	}

	// Update brightness value if slider has changed
	function _onSliderBrightnessChanged() {
		// Change luminosity value
		let old=bs;
		bs=Math.round(sliderBright.value * 3);
		if(old!=bs){
			// Write on file 
			_ApplyBrightness();
			
			if(saveState) {
				// Save settings
			    	settings.set_int('brightness', bs);
			}
		}
	}

	function _openSubmenu(){
		if(!menuOpened){
			menuOpened=true;
			settings.set_boolean('menu-opened',true);
		}
	}

	function _closeSubmenu(){
		if(menuOpened){
			menuOpened=false;
			popupMenuExpander.setSubmenuShown(menuOpened);
			settings.set_boolean('menu-opened',false);
		}
	}

	function _SaveCurrentState(){
		settings.set_int('brightness',bs);
	}

	function _ApplyBrightness(){
		let encoderToolPath='/usr/bin/encoder';
		encoderToolQ = Gio.File.new_for_path(encoderToolPath);

		let args = [encoderToolPath, "-b", bs.toString(10)]
		log(args.join(" "));
		GLib.spawn_sync(null, args, null, GLib.SpawnFlags.SEARCH_PATH, null);
	}

	// Compatibility with gnome-shell >= 3.32
	if (SHELL_MINOR > 30) {
		OmenKeyboard = GObject.registerClass(
			{GTypeName: 'OmenKeyboard'},
			OmenKeyboard
		);
	}

	function init() {
		settings = Convenience.getSettings();
		menuOpened=settings.get_boolean('menu-opened');
		saveState=settings.get_boolean('restore-on-restart');
		bs=settings.get_int('brightness');
		_ApplyBrightness();
		log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
	}

	function enable() {
		log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
		indicator = new OmenKeyboard();
		_ApplyBrightness();
		Main.panel.addToStatusArea(`${Me.metadata.name} Indicator`, indicator,0,'right');
	}

	function disable() {
		log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
   
		// REMINDER: It's required for extensions to clean up after themselves when
		// they are disabled. This is required for approval during review!
		if (indicator !== null) {
			indicator.destroy();
			indicator = null;
		}
	}
