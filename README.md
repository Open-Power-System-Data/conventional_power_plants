# 1. About Open Power System Data 
This notebook is part of the project [Open Power System Data](http://open-power-system-data.org). Open Power System Data develops a platform for free and open data for electricity system modeling. We collect, check, process, document, and provide data that are publicly available but currently inconvenient to use. 
More info on Open Power System Data:
- [Information on the project on our website](http://open-power-system-data.org)
- [Data and metadata on our data platform](http://data.open-power-system-data.org)
- [Data processing scripts on our GitHub page](https://github.com/Open-Power-System-Data)

# 2. About Jupyter Notebooks and GitHub
This file is a [Jupyter Notebook](http://jupyter.org/). A Jupyter Notebook is a file that combines executable programming code with visualizations and comments in markdown format, allowing for an intuitive documentation of the code. We use Jupyter Notebooks for combined coding and documentation. We use Python 3 as programming language. All Notebooks are stored on [GitHub](https://github.com/), a platform for software development, and are publicly available. More information on our IT-concept can be found [here](http://open-power-system-data.org/it). See also our [step-by-step manual](http://open-power-system-data.org/step-by-step) how to use the dataplatform.

# 3. About this Data Package
We provide data in different chunks, or [datapackages](http://frictionlessdata.io/data-packages/). The one you are looking at is on [conventional power plants](http://data.open-power-system-data.org/convetional_power_plants/), 

This notebook processes data on conventional power plants for Germany as well as other European countries. The data includes individual power plants with their technical characteristics. These include installed capacity, main energy source, type of technology, CHP capability, and geographical information.


# 4. Data sources
We use as publicly available data sources, which includes national statistical offices, ministries, regulatory authorities, transmission system operators, as well as other associations. All data sources are listed in the datapackage.json file including their link.

## 4.1 Germany
- "BNetzA Kraftwerksliste" [Download](http://www.bundesnetzagentur.de/DE/Sachgebiete/ElektrizitaetundGas/Unternehmen_Institutionen/Versorgungssicherheit/Erzeugungskapazitaeten/Kraftwerksliste/kraftwerksliste-node.html)
- "Umweltbundesamt Datenbank Kraftwerke in Deutschland" [Download](http://www.umweltbundesamt.de/dokument/datenbank-kraftwerke-in-deutschland)
- For efficiency estimation: Jonas Egerer, Clemens Gerbaulet, Richard Ihlenburg, Friedrich Kunz, Benjamin Reinhard, Christian von Hirschhausen, Alexander Weber, Jens Weibezahn (2014): **Electricity Sector Data for Policy-Relevant Modeling: Data Documentation and Applications to the German and European Electricity Markets**. DIW Data Documentation 72, Berlin, Germany. [Download](https://www.diw.de/documents/publikationen/73/diw_01.c.440963.de/diw_datadoc_2014-072.pdf)
- Other sources, e.g. for efficiency and georeferencing, are provided in the file

## 4.2 Selected European countries
- **AT**: **Verbund AG** (Austrian utility), Our hydro power plants [Download](https://www.verbund.com/en-at/about-verbund/power-plants/our-power-plants). Source links for conventional units are given in the column "source" of the power plant list
- **BE**: **ELIA** (Belgian transmission system operator), Generation facilities [Download](http://publications.elia.be/upload/ProductionParkOverview.xls?TS=20120416193815)
- **CH**: **BFE** (Swiss Federal Office of Energy), Statistik der Wasserkraftanlagen der Schweiz [Download](http://www.bfe.admin.ch/php/modules/publikationen/stream.php?extlang=de&name=de_416798061.zip&endung=Statistik%20der%20Wasserkraftanlagen%20der%20Schweiz) and Nuclear energy [Download](http://www.bfe.admin.ch/themen/00511/index.html?lang=en)
- **CZ**: **CEPS** (Czech transmission system operator), Available capacity [Download](http://www.ceps.cz/_layouts/15/Ceps/_Pages/GraphData.aspx?mode=xlsx&from=1/1/2010%2012:00:00%20AM&to=12/31/2015%2011:59:59%20PM&hasinterval=False&sol=9&lang=ENG&ver=YF&)
- **DK**: **Energinet.dk** (Danish transmission system operator), Energinet.dk's assumptions for analysis [Download](https://www.energinet.dk/SiteCollectionDocuments/Engelske%20dokumenter/El/Energinet%20dk%27s%20assumptions%20for%20analysis%202014-2035,%20September%202014.xlsm)
- **ES**: **SEDE** (Ministry of Industry, Energy and Tourism), Productores (in Conjunto de Datos) [Download](http://www6.mityc.es/aplicaciones/electra/ElectraExp.csv.zip)
- **FI**: ** Energy Authority**, Power plant register [Download](http://www.energiavirasto.fi/documents/10191/0/Energiaviraston+Voimalaitosrekisteri+010117.xlsx)
- **FR**: **RTE** (French tranmission system operator), List of production units of more than 100 MW [Download](http://clients.rte-france.com/servlets/CodesEICServlet)
- **IT**: **TERNA** (Italian transmission network operator), Installed generation capacity 2014 [Download](http://download.terna.it/terna/0000/0216/16.XLSX)
- **NL**: **TenneT** (Dutch transmission system operator), Available capacity in 2016 [Download](http://www.tennet.org/english/operational_management/export_data.aspx)
- **NO**: **Nordpool** (Power exchange), Power plant units (installed generation capacity larger than 100 MW) [Download](http://www.nordpoolspot.com/globalassets/download-center/tso/generation-capacity_norway_valid-from-2-december-2013_larger-than-100mw.pdf) (Link is not working as data has been deleted by Nordpool)
- **PL**: **GPI** (Exchange Information Platform by the Polish Power Exchange), List of generation units [Download](http://gpi.tge.pl/en/wykaz-jednostek?p_p_id=powerunits_WAR_powerunitsportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_cacheability=cacheLevelPage&p_p_col_id=column-1&p_p_col_count=1)
- **SE**: **Nordpool** (Power exchange), Installed generation capacity larger than 100 MW per unit in Sweden (17.12.2014) [Download](http://www.nordpoolspot.com/globalassets/download-center/tso/generation-capacity_sweden_larger-than-100mw-per-unit_17122014.pdf) (Link is not working as data has been deleted by Nordpool)
- **SI**: **Several sources**, Source links of data are given in the column "source" of the power plant list
- **SK**: **SEAS** (Slovakian utility), Power plants [Download](https://www.seas.sk/power-plants)
- **UK**: **Statistical Office**, Power stations in the United Kingdom, May 2015 (DUKES 5.10) [Download](https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/446457/dukes5_10.xls)


Beside the listed publicly available sources, additional, but decentralized, information on individual power plants are available (e.g. on operator's webpages). We therefore aim to continuously extend the lists by these information.

# 5. Model Output
The following standardized notation is used in this datapackage for energy sources, technology type:

## 5.1 Energy sources
Original Name in BNetzA-List|model output|Full name
:-:|:-:|:-:
Steinkohle|coal|Hard coal
Erdgas|natural_gas|Natural Gas
Braunkohle|lignite|Lignite
Kernenergie|uranium|Uranium
Pumpspeicher|pumped_storage|Pumped Storage (Water)
Biomasse|biomass|Biomass
Mineralölprodukte|oil|Mineral oil products 
Laufwasser|hydro|Water (run of river)
Sonstige Energieträger (nicht erneuerbar) |other_non_renewable|Other Fuels (not renewable)
Abfall|waste|Waste
Speicherwasser (ohne Pumpspeicher)|reservoir|Reservoir
Unbekannter Energieträger (nicht erneuerbar)|unknown_non_renewable|Unknown (not renewable)
Mehrere Energieträger (nicht erneuerbar)|multiple_non_renewable|Multiple (not renewable)
Deponiegas|gas_landfill|Landfill gas
Windenergie (Onshore-Anlage)|wind_onshore|Onshore wind
Windenergie (Offshore-Anlage)|wind_offshore|Offshore Wind
Solare Strahlungsenergie|solar|Solar energy
Klärgas|gas_sewage|Sewage Gas
Geothermie|geothermal|Geothermal energy
Grubengas|gas_mine|Mine Gas

## 5.2 Energy source structure
![OPSD-Tree](http://open-power-system-data.org/2016-10-25-opsd_tree.svg)

## 5.3 CHP type
CHP Type abbreviation|Full name
:-:|:-:
CHP|Combined heat and power
IPP|Industrial power plant


# 6. License
This notebook as well as all other documents in this repository is published under the [MIT License](LICENSE.md).

