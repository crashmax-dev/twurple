import AuthProvider from './Auth/AuthProvider';
import * as defaults from 'defaults';
import * as request from 'request-promise-native';
import { Cacheable, Cached, CachedGetter } from './Toolkit/Decorators';
import TokenInfo, { TokenInfoData } from './API/TokenInfo';
import { CheermoteBackground, CheermoteScale, CheermoteState } from './API/Bits/CheermoteList';
import { UniformObject } from './Toolkit/ObjectTools';

import BitsAPI from './API/Bits/BitsAPI';
import ChannelAPI from './API/Channel/ChannelAPI';
import UserAPI from './API/User/UserAPI';

export interface TwitchCheermoteConfig {
	defaultBackground: CheermoteBackground;
	defaultState: CheermoteState;
	defaultScale: CheermoteScale;
}

export interface TwitchConfig {
	authProvider: AuthProvider;
	preAuth: boolean;
	initialScopes: string[];
	cheermotes: TwitchCheermoteConfig;
}

export interface TwitchApiCallOptions {
	url: string;
	query?: UniformObject<string>;
	scope?: string;
	version?: number;
}

@Cacheable
export default class Twitch {
	readonly _config: TwitchConfig;

	public constructor(config: Partial<TwitchConfig>) {
		if (!config.authProvider) {
			throw new Error('No auth provider given');
		}

		this._config = defaults(config, {
			preAuth: false,
			initialScopes: [],
			cheermotes: {
				defaultBackground: CheermoteBackground.dark,
				defaultState: CheermoteState.animated,
				defaultScale: CheermoteScale.x1
			}
		});

		if (this._config.preAuth) {
			// noinspection JSIgnoredPromiseFromCall
			this._config.authProvider.getAuthToken(this._config.initialScopes || []);
		}
	}

	@Cached(600)
	public async getTokenInfo() {
		const data: TokenInfoData = await this.apiCall({url: '/'});
		return new TokenInfo(data.token, this);
	}

	// tslint:disable-next-line:no-any
	public async apiCall<T = any>(options: TwitchApiCallOptions): Promise<T> {
		const authToken = await this._config.authProvider.getAuthToken(options.scope ? [options.scope] : []);

		return await request({
			url: `https://api.twitch.tv/kraken/${options.url.replace(/^\//, '')}`,
			headers: {
				'Client-ID': this._config.authProvider.clientId,
				Authorization: `OAuth ${authToken}`,
				Accept: `application/vnd.twitchtv.v${options.version || 5}+json`
			},
			json: true,
			qs: options.query
		});
	}

	@CachedGetter()
	get bits() {
		return new BitsAPI(this);
	}

	@CachedGetter()
	get channels() {
		return new ChannelAPI(this);
	}

	@CachedGetter()
	get users() {
		return new UserAPI(this);
	}
}