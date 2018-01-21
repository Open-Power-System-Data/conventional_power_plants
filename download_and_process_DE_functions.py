# -*- coding: utf-8 -*-
"""
Created on Sat Jan 20 19:06:01 2018

@author: cfg
"""

import urllib.parse
import urllib.request
import posixpath
import datetime
import os
import logging
import pandas as pd
import numpy as np
import filecmp
import difflib

#from bokeh.io import output_notebook
#output_notebook()

import json
import sqlite3
import yaml
import hashlib


# Logging Setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', datefmt='%d %b %Y %H:%M:%S')
logger = logging.getLogger()

# create download and output folders if they do not exist
os.makedirs(os.path.join('download'), exist_ok=True)
os.makedirs(os.path.join('output'), exist_ok=True)
os.makedirs(os.path.join('output', 'original_data'), exist_ok=True)

def get_sha_hash(path, blocksize=65536):
    sha_hasher = hashlib.sha256()
    with open(path, 'rb') as f:
        buffer = f.read(blocksize)
        while len(buffer) > 0:
            sha_hasher.update(buffer)
            buffer = f.read(blocksize)
        return sha_hasher.hexdigest()

def downloadandcache(url):
    """
    Download a file into a folder called "downloads".
    Returns the local filepath.

    Parameters
    ----------
    url : str
        Url of a file to be downloaded

    """

    path = urllib.parse.urlsplit(url).path
    filename = posixpath.basename(path)
    now = datetime.datetime.now()
    datestring = str(now.year) + "-" + str(now.month) + "-" + str(now.day)
    filepath = os.path.join('download', datestring + "-" + filename)
    filepath_original_data = os.path.join('output',
                                          'original_data',
                                          filename)

    #check if file exists, otherwise download it
    if not os.path.exists(filepath):
        logger.info('Downloading file %s', filename)
        urllib.request.urlretrieve(url, filepath)
        urllib.request.urlretrieve(url, filepath_original_data)
    else:
        logger.info('Using local file from %s', filepath)

    foldername = 'download'

    return foldername, datestring, filename

def decrementday(year, month, day):
    if day > 1:
        day = day - 1
    else:
        day = 31
        if month > 1:
            month = month - 1
        else:
            month = 12
            year = year - 1

    return year, month, day

def getolderfilenameandcleanup(foldername, datestring, filename):
    originalfilepath = os.path.join(foldername, datestring + "-" + filename)
    now = datetime.datetime.now()
    year = now.year
    month = now.month
    day = now.day
    # loop through older possible files
    i = 0
    while i < 2000:
        i = i + 1
        year, month, day = decrementday(year, month, day)
#        print(year, month, day)
        datestring = str(year) + "-" + str(month) + "-" + str(day)
        filepath = os.path.join(foldername, datestring + "-" + filename)
#        print(filepath)
        if os.path.isfile(filepath) == True:
#            print('file exists:', filepath)
            arefilesidentical = filecmp.cmp(originalfilepath, filepath)
            # Check if file is identical to original file. If yes delete this file and continue
            if arefilesidentical == True:
#                print('files are identical, deleting', filepath)
                os.remove(filepath)
            else:
#                print('files are not identical:', filepath)
                return filepath
    raise ValueError('no older file found')

def getmatchinglist():
    # read matching list
    matchinglist=pd.read_csv(
        os.path.join('input', 'matching_bnetza_uba.csv'),
        skiprows=0,
        sep=',',  # CSV field separator, default is ','
        thousands=',',  # Thousands separator, default is ','
        decimal='.',  # Decimal separator, default is '.')
        encoding='cp1252')
    matchinglist['uba_id_string'] = (matchinglist['uba_match_name'] + '_' + matchinglist['uba_match_fuel'])
    return matchinglist

def getbnetzalist(url_bnetza, previous=False):
    foldername, datestring, filename = downloadandcache(url_bnetza)
    if previous == False:
        plantlist = pd.read_csv(os.path.join(foldername, datestring + "-" + filename),
                            skiprows=9,
                            sep=';',  # CSV field separator, default is ','
                            thousands='.',  # Thousands separator, default is ','
                            decimal=',',  # Decimal separator, default is '.'
                            encoding='cp1252')
        return plantlist
    elif previous == True:
        oldfilename = getolderfilenameandcleanup(foldername, datestring, filename)
        oldplantlist = pd.read_csv(oldfilename,
                            skiprows=9,
                            sep=';',  # CSV field separator, default is ','
                            thousands='.',  # Thousands separator, default is ','
                            decimal=',',  # Decimal separator, default is '.'
                            encoding='cp1252')
        return oldplantlist

def getubalist(url_uba, previous=False):
    foldername, datestring, filename = downloadandcache(url_uba)
    if previous == False:
        plantlist = pd.read_excel(os.path.join(foldername, datestring + "-" + filename), skiprows=9)
        return plantlist
    elif previous == True:
        oldfilename = getolderfilenameandcleanup(foldername, datestring, filename)
        oldplantlist = pd.read_excel(oldfilename, skiprows=9)
        return oldplantlist

def getlistdifferences(oldplantlist, newplantlist):
    oldplantlist['source'] = 'old'
    newplantlist['source'] = 'new'
    comparisonplantlist = pd.concat([oldplantlist, newplantlist])

    # Only include some columns in comparison
    includecolumns = ['Kraftwerksnummer Bundesnetzagentur',
                  'Kraftwerksname',
#                  'Bundesland',
                  'Blockname',
#       'Aufnahme der kommerziellen Stromerzeugung der derzeit in Betrieb befindlichen Erzeugungseinheit\n(Jahr)',
#       'Kraftwerksstatus \n(in Betrieb/\nvorläufig stillgelegt/\nsaisonale Konservierung\nGesetzlich an Stilllegung gehindert/\nSonderfall)',
#       'Energieträger',
#       'Spezifizierung "Mehrere Energieträger" und "Sonstige Energieträger" - Hauptbrennstoff',
#       'Spezifizierung "Mehrere Energieträger" - Zusatz- / Ersatzbrennstoffe',
#       'Auswertung\nEnergieträger (Zuordnung zu einem Hauptenergieträger bei Mehreren Energieträgern)',
#       'Vergütungsfähig nach EEG\n(ja/nein)',
#       'Wärmeauskopplung (KWK)\n(ja/nein)',
#       'Netto-Nennleistung (elektrische Wirkleistung) in MW',
        'Kraftwerksname / Standort',
       'Kraftwerksstandort',
       'Primärenergieträger',
       ]
    cols = [col for col in comparisonplantlist.columns if col in includecolumns]
    comparisonplantlist = comparisonplantlist.drop_duplicates( keep=False, subset = cols)
    # Sort by first column
    comparisonplantlist = comparisonplantlist.sort_values(comparisonplantlist.columns[0], ascending = True)
    return comparisonplantlist

def matchinglistcheck(plantlist_bnetza, plantlist_uba, matchinglist):
    logger.info('Starting Matchinglistcheck')
    plantlist_uba['uba_id_string'] = (plantlist_uba['Kraftwerksname / Standort']
                                      + '_' + plantlist_uba['Primärenergieträger'])
#    print(plantlist_uba.uba_id_string)
    matchinglist.rename(columns={'ID BNetzA' : 'bnetza_id'}, inplace=True)

    uba_entrylist =  [x for x in plantlist_uba.uba_id_string.tolist() if str(x) != 'nan']

    for entry in matchinglist.index:
#        print(entry, matchinglist.loc[entry].bnetza_id,  matchinglist.loc[entry].uba_id_string)
        bnetza_entries = plantlist_bnetza.loc[(plantlist_bnetza['Kraftwerksnummer Bundesnetzagentur'] == matchinglist.loc[entry].bnetza_id)]
#        print(entry, len(bnetza_entries))
        if len(bnetza_entries) == 0:
            print('Entry not in Bnetzalist:', matchinglist.loc[entry].bnetza_id, matchinglist.loc[entry].uba_id_string )
        uba_entries = plantlist_uba.loc[(plantlist_uba['uba_id_string'] == matchinglist.loc[entry].uba_id_string)]
#        print(entry, len(uba_entries))
        if len(uba_entries) == 0:
            alternatives = difflib.get_close_matches(matchinglist.loc[entry].uba_id_string, uba_entrylist, n=3, cutoff=0.6)
            print('Not in ubalist: ' + matchinglist.loc[entry].uba_id_string  +' ' + matchinglist.loc[entry].bnetza_id +  ' Possible alternatives: ' +  ', '.join(alternatives))
#            raise ValueError('Value in Ubalist missing')


### Testing this file
if __name__ == "__main__":

    # BNetzA Power plant list
    url_bnetza = ('http://www.bundesnetzagentur.de/SharedDocs/Downloads/DE/'
                  'Sachgebiete/Energie/Unternehmen_Institutionen/Versorgungssicherheit/'
                  'Erzeugungskapazitaeten/Kraftwerksliste/Kraftwerksliste_CSV.csv'
                  '?__blob=publicationFile&v=10')

    # UBA Power plant list
    url_uba = ('https://www.umweltbundesamt.de/sites/default/files/medien/372/dokumente/kraftwerke-de-ab-100-mw.xls')

    matchinglist = getmatchinglist()

    plantlist_bnetza = getbnetzalist(url_bnetza, previous=False)
    plantlist_bnetza_previous = getbnetzalist(url_bnetza, previous=True)
    plantlist_bnetza_differences = getlistdifferences(plantlist_bnetza_previous, plantlist_bnetza)

    plantlist_uba = getubalist(url_uba, previous=False)
    plantlist_uba_previous = getubalist(url_uba, previous=True)
    plantlist_uba_differences = getlistdifferences(plantlist_uba_previous, plantlist_uba)

    moin = matchinglistcheck(plantlist_bnetza, plantlist_uba, matchinglist)






