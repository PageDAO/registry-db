class PageDAORegistry {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://registry.pagedao.org/.netlify/functions/registry';
    this.apiKey = options.apiKey;
    this.registry = null;
    this.lastFetchTime = null;
  }

  async fetchRegistry(forceRefresh = false) {
    // Cache for 1 hour unless force refresh
    const ONE_HOUR = 60 * 60 * 1000;
    const shouldFetch = forceRefresh || 
                        !this.registry || 
                        !this.lastFetchTime || 
                        (Date.now() - this.lastFetchTime > ONE_HOUR);
    
    if (shouldFetch) {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.statusText}`);
      }
      
      this.registry = await response.json();
      this.lastFetchTime = Date.now();
    }
    
    return this.registry;
  }

  async getContracts(chain = 'all') {
    const registry = await this.fetchRegistry();
    
    if (chain === 'all') {
      return Object.entries(registry).reduce((all, [chainName, contracts]) => {
        return [...all, ...contracts.map(c => ({ ...c, chain: chainName }))];
      }, []);
    }
    
    return registry[chain]?.map(c => ({ ...c, chain })) || [];
  }

  async getContractByAddress(address, chain = null) {
    if (!address) return null;
    
    const registry = await this.fetchRegistry();
    const normalizedAddress = address.toLowerCase();
    
    if (chain && registry[chain]) {
      const found = registry[chain].find(c => 
        c.address.toLowerCase() === normalizedAddress
      );
      
      if (found) {
        return { ...found, chain };
      }
    } else {
      for (const [chainName, contracts] of Object.entries(registry)) {
        const found = contracts.find(c => 
          c.address.toLowerCase() === normalizedAddress
        );
        
        if (found) {
          return { ...found, chain: chainName };
        }
      }
    }
    
    return null;
  }

  // Admin methods (requires API key)
  async updateRegistry(newRegistry) {
    if (!this.apiKey) {
      throw new Error('API key required for updates');
    }
    
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(newRegistry)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update registry: ${response.statusText}`);
    }
    
    const result = await response.json();
    this.registry = null; // Invalidate cache
    return result;
  }
}

export default PageDAORegistry;