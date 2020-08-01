all: clean
	glib-compile-schemas src/schemas/
	cd src && zip -r omen-keyboard-gnome-extension * && mv omen-keyboard-gnome-extension.zip ..

install: uninstall all
	mkdir -p ~/.local/share/gnome-shell/extensions/omen-keyboard-gnome-extension
	cp -r src/* ~/.local/share/gnome-shell/extensions/omen-keyboard-gnome-extension
	
uninstall:
	rm -rf ~/.local/share/gnome-shell/extensions/tuxedo-keyboard-gnome-extension

clean:
	rm -f src/schemas/gschemas.compiled
	rm -f omen-keyboard-gnome-extension.zip
