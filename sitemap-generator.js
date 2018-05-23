var readline = require('readline');
var fs = require('fs');
var zlib = require('zlib');
var xml = require('xml');
var _ = require('lodash');

const ASSOCIATIONS_FILE = '/Users/gpeat/Downloads/18.04_association_data.json.gz';
const SITEMAP_DIR = 'app/sitemaps/1804/';
const SITEMAP_ATTRS = {
    _attr: {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd'
    }
};
const SITEMAP_INDEX_ATTRS = {
    _attr: {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9'
    }
};
const XML_OPTIONS = { declaration: true, indent: true };

var gzFileInput = fs.createReadStream(ASSOCIATIONS_FILE);
var gunzip = zlib.createGunzip();

var isodate = new Date().toISOString();
var rootPath = 'https://www.targetvalidation.org';

function page (path, priority) {
    return {
        url: [
            { loc: rootPath + path },
            { priority: priority },
            { lastmod: isodate }
        ]
    };
}
function sitemap (path) {
    return {
        sitemap: [
            { loc: rootPath + path },
            { lastmod: isodate }
        ]
    };
}

function writeXmlObject (xmlObject, fileStem) {
    if (xmlObject.urlset) {
        // how many urls; sitemap limit is 50K
        console.log(fileStem + ' sitemap contains ' + xmlObject.urlset.length + ' urls.');
    } else if (xmlObject.sitemapindex) {
        // how many sitemaps
        console.log(fileStem + ' sitemapindex contains ' + xmlObject.sitemapindex.length + ' sitemaps.');
    }

    // create xml as string; create fs
    const xmlString = xml(xmlObject, XML_OPTIONS);
    const out = fs.createWriteStream(SITEMAP_DIR + fileStem + '.xml.gz');
    const gzip = zlib.createGzip();

    // write
    gzip.pipe(out);
    gzip.write(xmlString);
    gzip.end();
}

function createSitemapIndex () {
    const SITEMAP_STATIC = sitemap('/sitemaps/1804/static.xml.gz');
    const SITEMAP_TARGET_PROFILES = sitemap('/sitemaps/1804/target-profiles.xml.gz');
    const SITEMAP_TARGET_ASSOCS = sitemap('/sitemaps/1804/target-associations.xml.gz');
    const SITEMAP_DISEASE_PROFILES = sitemap('/sitemaps/1804/disease-profiles.xml.gz');
    const SITEMAP_DISEASE_ASSOCS = sitemap('/sitemaps/1804/disease-associations.xml.gz');

    const xmlObject = {
        sitemapindex: [
            SITEMAP_INDEX_ATTRS,
            SITEMAP_STATIC,
            SITEMAP_TARGET_PROFILES,
            SITEMAP_TARGET_ASSOCS,
            SITEMAP_DISEASE_PROFILES,
            SITEMAP_DISEASE_ASSOCS
        ]
    };

    writeXmlObject(xmlObject, 'index');
}

function createSitemapStatic () {
    // create static pages sitemap; independent of data
    const PAGE_HOME = page('/', 1.0);
    const PAGE_ABOUT = page('/about', 0.8);
    const PAGE_DOWNLOADS = page('/data/downloads', 0.8);
    const PAGE_BATCH_SEARCH = page('/batch-search', 0.8);
    const PAGE_VARIANTS = page('/variants', 0.7);
    const PAGE_TERMS = page('/terms-of-use', 0.7);
    const PAGE_FAQ = page('/faq', 0.7);
    const PAGE_SCORING = page('/scoring', 0.7);

    const xmlObject = {
        urlset: [
            SITEMAP_ATTRS,
            PAGE_HOME,
            PAGE_ABOUT,
            PAGE_DOWNLOADS,
            PAGE_BATCH_SEARCH,
            PAGE_VARIANTS,
            PAGE_TERMS,
            PAGE_FAQ,
            PAGE_SCORING
        ]
    };

    writeXmlObject(xmlObject, 'static');
}

function createSitemapsDynamic () {
    const PRIORITY_ASSOCIATIONS_PAGE = 0.5;
    const PRIORITY_PROFILE_PAGE = 0.5;

    const xmlObjectTargetProfiles = { urlset: [SITEMAP_ATTRS] };
    const xmlObjectTargetAssociations = { urlset: [SITEMAP_ATTRS] };
    const xmlObjectDiseaseProfiles = { urlset: [SITEMAP_ATTRS] };
    const xmlObjectDiseaseAssociations = { urlset: [SITEMAP_ATTRS] };

    var targetIds = [];
    var diseaseIds = [];
    let lineCount = 0;
    readline.createInterface({
        input: gunzip
    }).on('line', line => {
        // each line is a JSON object; extract target and disease ids
        var association = JSON.parse(line);
        targetIds.push(association.target.id);
        diseaseIds.push(association.disease.id);
        lineCount++;
    }).on('close', () => {
        // calculate unique targets and diseases
        targetIds = _.uniq(targetIds);
        diseaseIds = _.uniq(diseaseIds);

        // log associations magnitude
        console.log('found ' + lineCount + ' associations');

        // target profiles
        targetIds.forEach(d => {
            const xmlPage = page('/target/' + d, PRIORITY_PROFILE_PAGE);
            xmlObjectTargetProfiles.urlset.push(xmlPage);
        });
        writeXmlObject(xmlObjectTargetProfiles, 'target-profiles');
        // target associations
        targetIds.forEach(d => {
            const xmlPage = page('/target/' + d + '/associations', PRIORITY_ASSOCIATIONS_PAGE);
            xmlObjectTargetAssociations.urlset.push(xmlPage);
        });
        writeXmlObject(xmlObjectTargetAssociations, 'target-associations');
        // disease profiles
        diseaseIds.forEach(d => {
            const xmlPage = page('/disease/' + d, PRIORITY_PROFILE_PAGE);
            xmlObjectDiseaseProfiles.urlset.push(xmlPage);
        });
        writeXmlObject(xmlObjectDiseaseProfiles, 'disease-profiles');
        // disease associations
        diseaseIds.forEach(d => {
            const xmlPage = page('/disease/' + d + '/associations', PRIORITY_ASSOCIATIONS_PAGE);
            xmlObjectDiseaseAssociations.urlset.push(xmlPage);
        });
        writeXmlObject(xmlObjectDiseaseAssociations, 'disease-associations');
    });

    gzFileInput.on('data', function (data) {
        gunzip.write(data);
    });
    gzFileInput.on('end', function () {
        gunzip.end();
    });
}

createSitemapIndex();
createSitemapStatic();
createSitemapsDynamic();
