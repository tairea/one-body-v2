// @ts-check

/**
 * @typedef {object} LayerDefinition
 * @property {'layer1' | 'layer2' | 'layer3'} key
 * @property {string} name
 * @property {string} description
 * @property {string} color
 */

/**
 * Returns the 3 community layer definitions, read from VITE_LAYER* env vars.
 * Falls back to DWeb defaults when vars are not set.
 * @returns {[LayerDefinition, LayerDefinition, LayerDefinition]}
 */
export function useLayers() {
  const env = import.meta.env;
  return [
    {
      key: /** @type {'layer1'} */ ('layer1'),
      name: env.VITE_LAYER1_NAME || 'Values',
      description: env.VITE_LAYER1_DESCRIPTION || 'The principles that guide how you move through the world.',
      color: env.VITE_LAYER1_COLOR || '#ff4f2d',
    },
    {
      key: /** @type {'layer2'} */ ('layer2'),
      name: env.VITE_LAYER2_NAME || 'Visions',
      description: env.VITE_LAYER2_DESCRIPTION || 'The futures you want to help bring into being.',
      color: env.VITE_LAYER2_COLOR || '#e06ef9',
    },
    {
      key: /** @type {'layer3'} */ ('layer3'),
      name: env.VITE_LAYER3_NAME || 'Vehicles',
      description: env.VITE_LAYER3_DESCRIPTION || 'The projects and initiatives you\'re driving.',
      color: env.VITE_LAYER3_COLOR || '#bbdf27',
    },
  ];
}
