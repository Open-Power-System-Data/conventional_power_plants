# -*- coding: utf-8 -*-

import urllib.parse
import urllib.request
import posixpath
import datetime
import os
import logging
import filecmp
import difflib
import json
import sqlite3
import hashlib
import yaml
import pandas as pd
import numpy as np
#from bokeh.io import output_notebook
# output_notebook()

# Logging Setup
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    datefmt='%d %b %Y %H:%M:%S')
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
    The file is prefixed with the download date YYYY-M-D-.
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

    # check if file exists, otherwise download it
    if not os.path.exists(filepath):
        logger.info('Downloading file %s', filename)
        urllib.request.urlretrieve(url, filepath)
        urllib.request.urlretrieve(url, filepath_original_data)
    else:
        logger.info('Using local file from %s', filepath)

    foldername = 'download'

    return foldername, datestring, filename


def decrementday(year, month, day):
    """
    Given values for year, month, and day, the values of the previous day are
    returned. At the moment, the function assumes that every month has 31 days,
    so that it will return February 31st when given values for March 1.

    Parameters
    ----------
    year : integer
        Integer year
    month : integer
        Integer month
    day : integer
        Integer day
    """

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
    """
    Given a set of foldername and filename as returned by
    the downloadandcache function, an older non-identical file with
    the same file structure is searched in the folder. Files identical to the
    one given are deleted.

    Parameters
    ----------
    foldername : str
        folder where files are located
    datestring : str
        string of original file date YYYY-M-D
    filename : str
        filename of original file

    """
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
        datestring = str(year) + "-" + str(month) + "-" + str(day)
        filepath = os.path.join(foldername, datestring + "-" + filename)
        # Does the file exist?
        if os.path.isfile(filepath):
            # Check if file is identical to original file. If yes delete this
            # file and continue
            if filecmp.cmp(originalfilepath, filepath):
                # print('files are identical, deleting', filepath)
                os.remove(filepath)
            else:
                # print('files are not identical:', filepath)
                return filepath
    raise ValueError('no older file found')


def getmatchinglist():
    """
    This function returns the matchinglist located under
    /input/matching_bnetza_uba.csv

    Parameters
    ----------
    none
    """
    # read matching list
    result = pd.read_csv(
        os.path.join('input', 'matching_bnetza_uba.csv'),
        skiprows=0,
        sep=',',  # CSV field separator, default is ','
        thousands=',',  # Thousands separator, default is ','
        decimal='.',  # Decimal separator, default is '.')
        encoding='cp1252')
    result['uba_id_string'] = (result['uba_match_name'] + '_'
                               + result['uba_match_fuel'])
    return result


def getbnetzalist(url_bnetza, previous=False):
    """
    This function returns the dataframe of the plantlist by the
    Bundesnetzagentur. if previous == True, the next-oldest different plantlist
    in the folder is returned as determined by the function
    getolderfilenameandcleanup.

    Parameters
    ----------
    url_bnetza : str
        URL of plant list
    previous : boolean
        Should previous plant list be returned?

    """
    foldername, datestring, filename = downloadandcache(url_bnetza)
    if not previous:
        plantlist = pd.read_csv(os.path.join(foldername, datestring + "-" + filename),
                                skiprows=9,
                                sep=';',  # CSV field separator, default is ','
                                thousands='.',  # Thousands separator, default is ','
                                decimal=',',  # Decimal separator, default is '.'
                                encoding='cp1252')
        return plantlist
    elif previous:
        oldfilename = getolderfilenameandcleanup(foldername, datestring, filename)
        oldplantlist = pd.read_csv(oldfilename,
                                   skiprows=9,
                                   sep=';',  # CSV field separator, default is ','
                                   thousands='.',  # Thousands separator, default is ','
                                   decimal=',',  # Decimal separator, default is '.'
                                   encoding='cp1252')
        return oldplantlist


def getubalist(url_uba, previous=False):
    """
    This function returns the dataframe of the plantlist by the
    Umweltbundesamt. if previous == True, the next-oldest different plantlist
    in the folder is returned as determined by the function
    getolderfilenameandcleanup.

    Parameters
    ----------
    url_uba : str
        URL of plant list
    previous : boolean
        Should previous plant list be returned?

    """
    foldername, datestring, filename = downloadandcache(url_uba)
    if not previous:
        plantlist = pd.read_excel(os.path.join(foldername, datestring + "-" + filename), skiprows=9)
        return plantlist
    elif previous:
        oldfilename = getolderfilenameandcleanup(foldername, datestring, filename)
        oldplantlist = pd.read_excel(oldfilename, skiprows=9)
        return oldplantlist


def getlistdifferences(oldplantlist, newplantlist):
    """
    This function returns the difference between two plantlists, and only takes
    into account the columns specified within the function.

    Parameters
    ----------
    oldplantlist : DataFrame
        Old PlantList
    newplantlist : DataFrame
        New Plantlist

    """
    oldplantlist['source'] = 'old'
    newplantlist['source'] = 'new'
    comparisonplantlist = pd.concat([oldplantlist, newplantlist])

    # Only include some columns in comparison
    includecolumns = ['Kraftwerksnummer Bundesnetzagentur',
                      'Kraftwerksname',
                      'Blockname',
                      'Kraftwerksname / Standort',
                      'Kraftwerksstandort',
                      'Primärenergieträger',
                     ]
    cols = [col for col in comparisonplantlist.columns if col in includecolumns]
    comparisonplantlist = comparisonplantlist.drop_duplicates(keep=False, subset=cols)
    # Sort by first column
    comparisonplantlist = comparisonplantlist.sort_values(comparisonplantlist.columns[0], ascending=True)
    return comparisonplantlist


def matchinglistcheck(plantlist_bnetza, plantlist_uba, matchinglist):
    """
    This function checks the BNetzA and UBA plantlists against the
    matchinglist and prints out errors. For entries form the UBA Plantlist a
    suggestion for correction with the closest possible match is printed.

    Parameters
    ----------
    oldplantlist : DataFrame
        Old PlantList
    newplantlist : DataFrame
        New Plantlist

    """
    logger.info('Starting Matchinglistcheck')
    plantlist_uba['uba_id_string'] = (plantlist_uba['Kraftwerksname / Standort']
                                      + '_' + plantlist_uba['Primärenergieträger'])
#    print(plantlist_uba.uba_id_string)
    matchinglist.rename(columns={'ID BNetzA': 'bnetza_id'}, inplace=True)

    uba_entrylist = [x for x in plantlist_uba.uba_id_string.tolist() if str(x) != 'nan']

    for entry in matchinglist.index:
        #        print(entry, matchinglist.loc[entry].bnetza_id,  matchinglist.loc[entry].uba_id_string)
        bnetza_entries = plantlist_bnetza.loc[(plantlist_bnetza['Kraftwerksnummer Bundesnetzagentur'] == matchinglist.loc[entry].bnetza_id)]
#        print(entry, len(bnetza_entries))
        if len(bnetza_entries) == 0:
            print('Entry not in Bnetzalist:', matchinglist.loc[entry].bnetza_id, matchinglist.loc[entry].uba_id_string)
        uba_entries = plantlist_uba.loc[(plantlist_uba['uba_id_string'] == matchinglist.loc[entry].uba_id_string)]
#        print(entry, len(uba_entries))
        if len(uba_entries) == 0:
            alternatives = difflib.get_close_matches(matchinglist.loc[entry].uba_id_string, uba_entrylist, n=3, cutoff=0.6)
            print('Not in ubalist: ' + matchinglist.loc[entry].uba_id_string + ' ' + matchinglist.loc[entry].bnetza_id + ' Possible alternatives: ' + ', '.join(alternatives))
#            raise ValueError('Value in Ubalist missing')


# Testing this file
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

    matchinglistcheck(plantlist_bnetza, plantlist_uba, matchinglist)
