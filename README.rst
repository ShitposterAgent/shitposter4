.. These are examples of badges you might want to add to your README:
   please update the URLs accordingly

    .. image:: https://api.cirrus-ci.com/github/<USER>/shitposter4.svg?branch=main
        :alt: Built Status
        :target: https://cirrus-ci.com/github/<USER>/shitposter4
    .. image:: https://readthedocs.org/projects/shitposter4/badge/?version=latest
        :alt: ReadTheDocs
        :target: https://shitposter4.readthedocs.io/en/stable/
    .. image:: https://img.shields.io/coveralls/github/<USER>/shitposter4/main.svg
        :alt: Coveralls
        :target: https://coveralls.io/r/<USER>/shitposter4
    .. image:: https://img.shields.io/pypi/v/shitposter4.svg
        :alt: PyPI-Server
        :target: https://pypi.org/project/shitposter4/
    .. image:: https://img.shields.io/conda/vn/conda-forge/shitposter4.svg
        :alt: Conda-Forge
        :target: https://anaconda.org/conda-forge/shitposter4
    .. image:: https://pepy.tech/badge/shitposter4/month
        :alt: Monthly Downloads
        :target: https://pepy.tech/project/shitposter4
    .. image:: https://img.shields.io/twitter/url/http/shields.io.svg?style=social&label=Twitter
        :alt: Twitter
        :target: https://twitter.com/shitposter4

.. image:: https://img.shields.io/badge/-PyScaffold-005CA0?logo=pyscaffold
    :alt: Project generated with PyScaffold
    :target: https://pyscaffold.org/

|

===========
ShitPoster4
===========


    A powerful desktop automation agent with browser automation capabilities


ShitPoster4 is a comprehensive automation toolkit that combines browser automation through Playwright with desktop automation capabilities. This powerful tool lets you automate repetitive tasks across your entire computer.

Features
========

* **Browser Automation**: Control web browsers with precision using Playwright
* **Desktop Control**: Automate keyboard and mouse interactions on your desktop
* **Cross-Platform**: Works on Windows, macOS, and Linux
* **Easy-to-Use UI**: Web-based interface for configuring and running automations
* **Extensible**: Add your own automation scripts and modules

Getting Started
==============

Installation
-----------

To install the base package:

.. code-block:: bash

    pip install .

For platform-specific features:

.. code-block:: bash

    # For Windows
    pip install .[windows]
    
    # For macOS
    pip install .[macos]
    
    # For all desktop automation features
    pip install .[desktop]

Running the Application
---------------------

1. Start the backend server:

.. code-block:: bash

    cd ffi/backend
    cargo run

2. Start the web interface:

.. code-block:: bash

    cd ffi/webui
    npm run dev

3. Open your browser and navigate to http://localhost:3000

Architecture
===========

The application consists of three main components:

1. **Python Core**: Handles desktop automation through PyAutoGUI and platform-specific APIs
2. **Rust Backend**: Manages the Playwright browser automation and provides an API
3. **Next.js Frontend**: User interface for configuring and running automations

Security Notice
=============

This tool provides powerful automation capabilities. Use responsibly and only on systems and websites where you have permission to do so.

.. _pyscaffold-notes:

Note
====

This project has been set up using PyScaffold 4.6. For details and usage
information on PyScaffold see https://pyscaffold.org/.
