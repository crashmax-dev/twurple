import { Enumerable } from '@d-fischer/shared-utils';
import type { HelixUser } from '../User/HelixUser';
import type { ApiClient } from '../../../ApiClient';

/** @private */
export interface HelixBanData {
	user_id: string;
	user_name: string;
	expires_at: string;
}

/**
 * Information about the ban of a user.
 */
export class HelixBan {
	/** @private */
	@Enumerable(false) protected readonly _client: ApiClient;

	/** @private */
	constructor(private readonly _data: HelixBanData, client: ApiClient) {
		this._client = client;
	}

	/**
	 * The ID of the user.
	 */
	get userId(): string {
		return this._data.user_id;
	}

	/**
	 * Retrieves more data about the user.
	 */
	async getUser(): Promise<HelixUser | null> {
		return this._client.helix.users.getUserById(this._data.user_id);
	}

	/**
	 * The name of the user.
	 */
	get userName(): string {
		return this._data.user_name;
	}

	/**
	 * The date when the ban will expire; null for permanent bans.
	 */
	get expiryDate(): Date | null {
		return this._data.expires_at ? new Date(this._data.expires_at) : null;
	}
}
