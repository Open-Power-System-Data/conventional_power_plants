# Open Power System Data: Power plants

## About this data package

This data package collects and combines information about power plants in Germany. 
It downloads the power plant list from the Bundesnetzagentur and augments it with more information from the Umweltbundesamt as well as other self-researched sources.
Main data points are the power plants themselves including relevant characteristics such as fuel and capacity. 
Further information regarding the plants' coordinates and estimated efficiency are included as well.

## Data sources

We use as data sources:

- the "BNetzA Kraftwerksliste" [Download](http://www.bundesnetzagentur.de/DE/Sachgebiete/ElektrizitaetundGas/Unternehmen_Institutionen/Versorgungssicherheit/Erzeugungskapazitaeten/Kraftwerksliste/kraftwerksliste-node.html)
- The "Umweltbundesamt Datenbank Kraftwerke in Deutschland" [Download](http://www.umweltbundesamt.de/dokument/datenbank-kraftwerke-in-deutschland)
- For efficiency estimation: Jonas Egerer, Clemens Gerbaulet, Richard Ihlenburg, Friedrich Kunz, Benjamin Reinhard, Christian von Hirschhausen, Alexander Weber, Jens Weibezahn (2014): **Electricity Sector Data for Policy-Relevant Modeling: Data Documentation and Applications to the German and European Electricity Markets**. DIW Data Documentation 72, Berlin, Germany. [Download](https://www.diw.de/documents/publikationen/73/diw_01.c.440963.de/diw_datadoc_2014-072.pdf)
- Various other sources, referenced in the file itself

## Links to the notebooks in this data package

- [Main notebook](main.ipynb) (includes explanation of notation used in the data package)
- [Download and process (Germany)](download_and_process_DE.ipynb)
- [Download and process (rest of EU)](download_and_process_DE.ipynb)

## License

The scripts in this data package are published under the [MIT license](LICENSE.md).
