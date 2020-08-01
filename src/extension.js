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

	// Modified for Omen by Taras Zakharchenko
	
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
	
	const ExtensionUtils = imports.misc.extensionUtils;
	const Me = ExtensionUtils.getCurrentExtension();
	
	// import own scripts
	const Convenience = Me.imports.convenience;                       

	// For compatibility checks, as described above
	const Config = imports.misc.config;
	const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

	const Slider = imports.ui.slider;
	const CheckBox = imports.ui.checkBox;

	//Import Lang because we will write code in a Object Oriented Manner

	const Lang = imports.lang;

	// GLobal vairables
	// UI Obj
	let sliderBright, popupMenuExpander, popupMenuSpeedExpander;
	let rippleMenuItem, lwaveMenuItem, rwaveMenuItem, breatheMenuItem;
	let slowMenuItem, mediumMenuItem, fastMenuItem;
	// Variables
	let menuOpened,bs;
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

			// Animations menu
			rippleMenuItem = new PopupMenu.PopupSwitchMenuItem('Ripple', false);
			lwaveMenuItem = new PopupMenu.PopupSwitchMenuItem('Left wave', false);
			rwaveMenuItem = new PopupMenu.PopupSwitchMenuItem('Right wave', false);
			breatheMenuItem = new PopupMenu.PopupSwitchMenuItem('Breathe', false);
			
			popupMenuExpander = new PopupMenu.PopupSubMenuMenuItem('Animation mode');

			popupMenuExpander.menu.addMenuItem(rippleMenuItem);
			popupMenuExpander.menu.addMenuItem(lwaveMenuItem);
			popupMenuExpander.menu.addMenuItem(rwaveMenuItem);
			popupMenuExpander.menu.addMenuItem(breatheMenuItem);
			this.menu.addMenuItem(popupMenuExpander);

			slowMenuItem = new PopupMenu.PopupSwitchMenuItem('Slow', false);
			mediumMenuItem = new PopupMenu.PopupSwitchMenuItem('Medium', false);
			fastMenuItem = new PopupMenu.PopupSwitchMenuItem('Fast', false);

			popupMenuSpeedExpander = new PopupMenu.PopupSubMenuMenuItem('Animation speed');
			popupMenuSpeedExpander.menu.addMenuItem(slowMenuItem);
			popupMenuSpeedExpander.menu.addMenuItem(mediumMenuItem);
			popupMenuSpeedExpander.menu.addMenuItem(fastMenuItem);
			this.menu.addMenuItem(popupMenuSpeedExpander);

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

			_ResetBrightness();
			_LoadSettingsToInterface();
			_ApplyConfiguration();

			sliderBright.connect('notify::value', _onSliderBrightnessChanged);
			rippleMenuItem.connect('toggled', _onAnimationRippleSelect);
			lwaveMenuItem.connect('toggled', _onAnimationLwaveSelect);
			rwaveMenuItem.connect('toggled', _onAnimationRwaveSelect);
			breatheMenuItem.connect('toggled', _onAnimationBreatheSelect);
			
			slowMenuItem.connect('toggled', _onAnimationSlowSelect);
			mediumMenuItem.connect('toggled', _onAnimationMediumSelect);
			fastMenuItem.connect('toggled', _onAnimationFastSelect);
		}	
	}

	function _LoadSettingsToInterface() {
		anitype = settings.get_string('animation-type')
		if(anitype == 'ripple')
		{
			rippleMenuItem.setToggleState(true);
		}
		else if(anitype == 'left_wave')
		{
			lwaveMenuItem.setToggleState(true);
		}
		else if(anitype == 'right_wave')
		{
			rwaveMenuItem.setToggleState(true);
		}
		else if(anitype == 'breathe')
		{
			breatheMenuItem.setToggleState(true);
		}

		sliderBright.value = 3 * settings.get_int('brightness');
	}

	function _onAnimationSlowSelect(toggled) {
		mediumMenuItem.setToggleState(false);
		fastMenuItem.setToggleState(false);
		slowMenuItem.setToggleState(true);
		settings.set_string('animation-speed', 'slow');
		_ApplyConfiguration();
	}

	function _onAnimationMediumSelect(toggled) {
		slowMenuItem.setToggleState(false);
		fastMenuItem.setToggleState(false);
		mediumMenuItem.setToggleState(true);
		settings.set_string('animation-speed', 'medium');
		_ApplyConfiguration();
	}

	function _onAnimationFastSelect(toggled) {
		slowMenuItem.setToggleState(false);
		mediumMenuItem.setToggleState(false);
		fastMenuItem.setToggleState(true);
		settings.set_string('animation-speed', 'fast');
		_ApplyConfiguration();
	}

	function _onAnimationRippleSelect(toggled) {
		lwaveMenuItem.setToggleState(false);
		rwaveMenuItem.setToggleState(false);
		breatheMenuItem.setToggleState(false);
		if(rippleMenuItem.state == false)
		{
			settings.set_string('animation-type', 'off');
			_ResetBrightness();
		}
		else
			settings.set_string('animation-type', 'ripple');
		_ApplyConfiguration();
	}

	function _onAnimationLwaveSelect(toggled) {
		rippleMenuItem.setToggleState(false);
		rwaveMenuItem.setToggleState(false);
		breatheMenuItem.setToggleState(false);
		if(lwaveMenuItem.state == false)
		{
			settings.set_string('animation-type', 'off');
			_ResetBrightness();
		}
		else
			settings.set_string('animation-type', 'left_wave');
		_ApplyConfiguration();
	}

	function _onAnimationRwaveSelect(toggled) {
		rippleMenuItem.setToggleState(false);
		lwaveMenuItem.setToggleState(false);
		breatheMenuItem.setToggleState(false);
		if(rwaveMenuItem.state == false)
		{
			settings.set_string('animation-type', 'off');
			_ResetBrightness();
		}
		else
			settings.set_string('animation-type', 'right_wave');
		_ApplyConfiguration();
	}

	function _onAnimationBreatheSelect(toggled) {
		rippleMenuItem.setToggleState(false);
		lwaveMenuItem.setToggleState(false);
		rwaveMenuItem.setToggleState(false);
		if(breatheMenuItem.state == false)
		{
			settings.set_string('animation-type', 'off');
			_ResetBrightness();
		}
		else
			settings.set_string('animation-type', 'breathe');
		_ApplyConfiguration();
	}

	// Update brightness value if slider has changed
	function _onSliderBrightnessChanged() {
		bs=Math.floor(sliderBright.value * 3);
		_ApplyConfiguration();
		settings.set_int('brightness', bs);
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

	function _ResetBrightness()
	{
		let encoderToolPath='/usr/bin/encoder';
		let args = [encoderToolPath, "-s"];
		GLib.spawn_sync(null, args, null, GLib.SpawnFlags.SEARCH_PATH, null);
	}

	function _ApplyConfiguration(){
		let encoderToolPath='/usr/bin/encoder';
		encoderToolQ = Gio.File.new_for_path(encoderToolPath);
		let args = [encoderToolPath, "-b", settings.get_int('brightness').toString(10)];
		if (settings.get_string('animation-type') != "off")
		{
			args.push("-a");
			args.push(settings.get_string('animation-type'));

			args.push("-v");
			args.push(settings.get_string('animation-speed'));
		}

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
		bs=settings.get_int('brightness');
		_ApplyConfiguration();
		log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
	}

	function enable() {
		log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
		indicator = new OmenKeyboard();
		_ApplyConfiguration();
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
