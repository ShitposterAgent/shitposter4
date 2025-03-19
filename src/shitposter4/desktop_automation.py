"""
Desktop automation capabilities for shitposter4.
This module extends the web automation with desktop capabilities.
"""

import logging
import subprocess
import time
import platform
import sys
import os
from typing import Optional, Dict, Any, List, Tuple, Union

_logger = logging.getLogger(__name__)

class DesktopAutomator:
    """Class to handle desktop automation across platforms."""
    
    def __init__(self):
        self.platform = platform.system().lower()
        self._check_dependencies()
    
    def _check_dependencies(self):
        """Check if required dependencies are installed."""
        dependencies = []
        
        if self.platform == 'windows':
            try:
                import pywinauto
                _logger.info("pywinauto is installed")
            except ImportError:
                dependencies.append("pywinauto")
        
        if self.platform == 'darwin':  # macOS
            try:
                import Quartz
                _logger.info("pyobjc-framework-Quartz is installed")
            except ImportError:
                dependencies.append("pyobjc-framework-Quartz")
        
        if self.platform == 'linux':
            # Check for xdotool on Linux
            try:
                subprocess.run(["xdotool", "--version"], 
                               check=True, 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE)
                _logger.info("xdotool is installed")
            except (subprocess.SubprocessError, FileNotFoundError):
                dependencies.append("xdotool (system package)")
        
        # Check for common dependencies
        try:
            import pyautogui
            _logger.info("pyautogui is installed")
        except ImportError:
            dependencies.append("pyautogui")
        
        if dependencies:
            _logger.warning(f"Missing dependencies: {', '.join(dependencies)}")
            _logger.info("Please install missing dependencies to use all features.")
    
    def click(self, x: int, y: int) -> Tuple[bool, str]:
        """Click at the specified coordinates."""
        try:
            import pyautogui
            pyautogui.click(x, y)
            return True, f"Clicked at coordinates ({x}, {y})"
        except Exception as e:
            _logger.error(f"Click failed: {str(e)}")
            return False, f"Click failed: {str(e)}"
    
    def type_text(self, text: str) -> Tuple[bool, str]:
        """Type the specified text."""
        try:
            import pyautogui
            pyautogui.typewrite(text)
            return True, f"Typed text: {text[:20]}{'...' if len(text) > 20 else ''}"
        except Exception as e:
            _logger.error(f"Typing failed: {str(e)}")
            return False, f"Typing failed: {str(e)}"
    
    def press_key(self, key: str) -> Tuple[bool, str]:
        """Press a specific key."""
        try:
            import pyautogui
            pyautogui.press(key)
            return True, f"Pressed key: {key}"
        except Exception as e:
            _logger.error(f"Key press failed: {str(e)}")
            return False, f"Key press failed: {str(e)}"
    
    def find_image(self, image_path: str, confidence: float = 0.9) -> Optional[Tuple[int, int]]:
        """Find an image on the screen and return its position."""
        try:
            import pyautogui
            position = pyautogui.locateOnScreen(image_path, confidence=confidence)
            if position:
                point = pyautogui.center(position)
                return point.x, point.y
            return None
        except Exception as e:
            _logger.error(f"Image recognition failed: {str(e)}")
            return None
    
    def click_image(self, image_path: str, confidence: float = 0.9) -> Tuple[bool, str]:
        """Find an image on screen and click it."""
        position = self.find_image(image_path, confidence)
        if position:
            x, y = position
            return self.click(x, y)
        else:
            return False, f"Image not found on screen: {image_path}"
    
    def screenshot(self, path: str) -> Tuple[bool, str]:
        """Take a screenshot and save it."""
        try:
            import pyautogui
            screenshot = pyautogui.screenshot()
            screenshot.save(path)
            return True, f"Screenshot saved to {path}"
        except Exception as e:
            _logger.error(f"Screenshot failed: {str(e)}")
            return False, f"Screenshot failed: {str(e)}"
    
    def get_window_list(self) -> List[Dict[str, Any]]:
        """Get a list of open windows (platform specific)."""
        windows = []
        
        if self.platform == 'windows':
            try:
                import pywinauto
                desktop = pywinauto.Desktop(allow_magic_lookup=False)
                for window in desktop.windows():
                    if window.is_visible() and window.window_text():
                        windows.append({
                            "title": window.window_text(),
                            "handle": window.handle
                        })
            except Exception as e:
                _logger.error(f"Failed to get windows: {str(e)}")
        
        elif self.platform == 'linux':
            try:
                output = subprocess.check_output(
                    ["wmctrl", "-l"], 
                    universal_newlines=True
                )
                for line in output.splitlines():
                    parts = line.split(None, 3)
                    if len(parts) >= 4:
                        windows.append({
                            "handle": parts[0],
                            "desktop": parts[1],
                            "host": parts[2],
                            "title": parts[3]
                        })
            except Exception as e:
                _logger.error(f"Failed to get windows: {str(e)}")
        
        elif self.platform == 'darwin':
            try:
                import Quartz
                window_list = Quartz.CGWindowListCopyWindowInfo(
                    Quartz.kCGWindowListOptionOnScreenOnly | 
                    Quartz.kCGWindowListExcludeDesktopElements,
                    Quartz.kCGNullWindowID
                )
                for window in window_list:
                    windows.append({
                        "title": window.get('kCGWindowName', ''),
                        "id": window.get('kCGWindowNumber', ''),
                        "app": window.get('kCGWindowOwnerName', '')
                    })
            except Exception as e:
                _logger.error(f"Failed to get windows: {str(e)}")
                
        return windows
    
    def focus_window(self, title_or_handle: str) -> bool:
        """Focus a window by its title or handle."""
        if self.platform == 'windows':
            try:
                import pywinauto
                try:
                    # Try as handle first
                    window = pywinauto.Application().connect(handle=int(title_or_handle))
                    window.top_window().set_focus()
                except (ValueError, TypeError):
                    # Try as title
                    window = pywinauto.Application().connect(title=title_or_handle, fuzzy=True)
                    window.top_window().set_focus()
                return True
            except Exception as e:
                _logger.error(f"Failed to focus window: {str(e)}")
                return False
                
        elif self.platform == 'linux':
            try:
                try:
                    # Try as window ID first
                    subprocess.run(["wmctrl", "-i", "-a", title_or_handle], check=True)
                except subprocess.CalledProcessError:
                    # Try as window title
                    subprocess.run(["wmctrl", "-a", title_or_handle], check=True)
                return True
            except Exception as e:
                _logger.error(f"Failed to focus window: {str(e)}")
                return False
                
        elif self.platform == 'darwin':
            try:
                script = f'''
                tell application "System Events"
                    set frontmost of (first process whose frontmost is true) to false
                    set frontmost of (first process whose name contains "{title_or_handle}") to true
                end tell
                '''
                subprocess.run(["osascript", "-e", script], check=True)
                return True
            except Exception as e:
                _logger.error(f"Failed to focus window: {str(e)}")
                return False
                
        return False
    
    def run_script(self, script_path: str, args: List[str] = None) -> Tuple[bool, str, str]:
        """Run a script file with arguments."""
        if not os.path.exists(script_path):
            return False, "", f"Script not found: {script_path}"
            
        cmd = [script_path]
        if args:
            cmd.extend(args)
            
        try:
            process = subprocess.run(
                cmd,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return True, process.stdout, process.stderr
        except subprocess.CalledProcessError as e:
            return False, e.stdout, e.stderr
        except Exception as e:
            return False, "", str(e)


class AutomationServer:
    """Simple HTTP server for desktop automation."""
    
    def __init__(self, host='127.0.0.1', port=3002):
        self.host = host
        self.port = port
        self.automator = DesktopAutomator()
        
    def start(self):
        """Start the automation server."""
        from flask import Flask, request, jsonify
        import threading
        
        app = Flask("DesktopAutomation")
        
        @app.route('/api/desktop/click', methods=['POST'])
        def api_click():
            data = request.json
            x = data.get('x')
            y = data.get('y')
            
            if x is None or y is None:
                return jsonify({"status": "error", "message": "X and Y coordinates required"})
                
            success, message = self.automator.click(int(x), int(y))
            return jsonify({"status": "success" if success else "error", "message": message})
        
        @app.route('/api/desktop/type', methods=['POST'])
        def api_type():
            data = request.json
            text = data.get('text')
            
            if not text:
                return jsonify({"status": "error", "message": "Text required"})
                
            success, message = self.automator.type_text(text)
            return jsonify({"status": "success" if success else "error", "message": message})
        
        @app.route('/api/desktop/press', methods=['POST'])
        def api_press():
            data = request.json
            key = data.get('key')
            
            if not key:
                return jsonify({"status": "error", "message": "Key required"})
                
            success, message = self.automator.press_key(key)
            return jsonify({"status": "success" if success else "error", "message": message})
        
        @app.route('/api/desktop/screenshot', methods=['POST'])
        def api_screenshot():
            data = request.json
            path = data.get('path')
            
            if not path:
                path = f"screenshot_{int(time.time())}.png"
                
            success, message = self.automator.screenshot(path)
            return jsonify({"status": "success" if success else "error", "message": message, "path": path})
        
        @app.route('/api/desktop/windows', methods=['GET'])
        def api_windows():
            windows = self.automator.get_window_list()
            return jsonify({"status": "success", "windows": windows})
        
        @app.route('/api/desktop/focus', methods=['POST'])
        def api_focus():
            data = request.json
            window = data.get('window')
            
            if not window:
                return jsonify({"status": "error", "message": "Window title/handle required"})
                
            success = self.automator.focus_window(window)
            return jsonify({
                "status": "success" if success else "error", 
                "message": f"Focused window: {window}" if success else f"Failed to focus window: {window}"
            })
            
        def run_server():
            app.run(host=self.host, port=self.port)
            
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        _logger.info(f"Desktop automation server running at http://{self.host}:{self.port}")
        
        return server_thread


def main():
    """Run the desktop automation server as a standalone application."""
    logging.basicConfig(level=logging.INFO)
    server = AutomationServer()
    server_thread = server.start()
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        _logger.info("Server stopped")
        sys.exit(0)


if __name__ == "__main__":
    main()
