import axios from 'axios';
import { copy } from 'copy-anything';

import { check, errorHandler } from '../../errors';
import { CompanyEnrichmentParams, CompanyEnrichmentResponse, EnrichmentType, PersonEnrichmentParams, PersonEnrichmentResponse } from '../../types/enrichment-types';
import { parseRateLimitingResponse } from '../../utils/api-utils';

export default <T extends PersonEnrichmentParams | CompanyEnrichmentParams, K extends PersonEnrichmentResponse | CompanyEnrichmentResponse>(
  basePath: string,
  sandboxBasePath: string,
  apiKey: string,
  params: T,
  type: EnrichmentType,
) => new Promise<K>((resolve, reject) => {
  check(params, basePath, apiKey, null, 'enrichment').then(() => {
    const headers = {
      'Accept-Encoding': 'gzip',
      'User-Agent': 'PDL-JS-SDK',
    };

    const url = params.sandbox && type === 'person' ? `${sandboxBasePath}/${type}/enrich` : `${basePath}/${type}/enrich`;

    const newParams = copy(params);
    const p = new URLSearchParams();
    delete newParams.sandbox;

    Object.entries(newParams).forEach(([key, value]) => {
      if (key === 'profile') {
        if (Array.isArray(value)) {
          p.append(key, JSON.stringify(value));
        } else {
          p.append(key, value);
        }
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          value.forEach((member) => {
            p.append(key, (member));
          });
        } else {
          p.append(key, JSON.stringify(value));
        }
      } else {
        p.append(key, (value));
      }
    });

    p.append('api_key', apiKey);

    axios.get<K>(url, {
      params: p,
      headers,
    })
      .then((response) => {
        if (response?.data?.status === 200) {
          resolve(parseRateLimitingResponse(response));
        }
      })
      .catch((error) => {
        reject(errorHandler(error));
      });
  }).catch((error) => {
    reject(error);
  });
});
