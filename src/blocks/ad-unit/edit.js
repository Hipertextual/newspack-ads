/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { ExternalLink, SelectControl, Placeholder, withNotices } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies.
 */
import { icon } from './';

class Edit extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			adUnits: null,
		};
	}

	componentDidMount() {
		apiFetch( { path: '/newspack/v1/wizard/adunits' } ).then( adUnits =>
			this.setState( { adUnits, initialUpdate: true } )
		);
	}

	componentDidUpdate( prevProps ) {
		const { attributes, noticeOperations } = this.props;
		const { activeAd } = attributes;
		if ( activeAd !== prevProps.attributes.activeAd ) {
			const { code, width, height } = this.activeAdDataForActiveAd( activeAd );
			if ( code && ( ! width && ! height ) ) {
				noticeOperations.createErrorNotice( __( 'Invalid ad unit code. No dimensions available' ) );
			} else {
				noticeOperations.removeAllNotices();
			}
		}
	}

	adUnitsForSelect = adUnits => {
		return [
			{
				label: __( 'Select an ad unit' ),
				value: null,
			},
			...Object.values( adUnits ).map( adUnit => {
				return {
					label: adUnit.name,
					value: adUnit.id,
				};
			} ),
		];
	};

	activeAdDataForActiveAd = activeAd => {
		const { adUnits } = this.state;
		const data =
			adUnits && adUnits.find( adUnit => parseInt( adUnit.id ) === parseInt( activeAd ) );
		return this.dimensionsFromAd( data );
	};

	dimensionsFromAd = adData => {
		const { noticeOperations } = this.props;
		const { ad_code, amp_ad_code } = adData || {};
		const code = ad_code ? ad_code : amp_ad_code;
		const widthRegex = /width[:=].*?([0-9].*?)(?:px|\s)/i;
		const widthMatch = ( code || '' ).match( widthRegex );
		const heightRegex = /height[:=].*?([0-9].*?)(?:px|\s)/i;
		const heightMatch = ( code || '' ).match( heightRegex );
		const width = widthMatch && parseInt( widthMatch[ 1 ] );
		const height = heightMatch && parseInt( heightMatch[ 1 ] );
		return {
			ad_code,
			amp_ad_code,
			width,
			height,
		};
	};

	render() {
		/**
		 * Constants
		 */
		const { attributes, setAttributes, noticeUI } = this.props;
		const { activeAd } = attributes;
		const { adUnits } = this.state;
		const { width, height } = this.activeAdDataForActiveAd( activeAd );
		const style =
			width && height
				? {
						width: `${ width || 400 }px`,
						height: `${ height || 100 }px`,
				  }
				: {};
		return (
			<Fragment>
				{ noticeUI }
				<div className="wp-block-newspack-ads-blocks-ad-unit">
					<div className="newspack-ads-ad-unit" style={ style }>
						<Placeholder>
							{ adUnits && !! adUnits.length && (
								<SelectControl
									label={ __( 'Ad Unit' ) }
									value={ activeAd }
									options={ this.adUnitsForSelect( adUnits ) }
									onChange={ activeAd => setAttributes( { activeAd } ) }
								/>
							) }
							{ adUnits && ! adUnits.length && (
								<Fragment>
									{ __( 'No ad units have been created yet.' ) }
									<ExternalLink href="/wp-admin/admin.php?page=newspack-google-ad-manager-wizard#/">
										{ __( 'You can create ad units in the Ads wizard' ) }
									</ExternalLink>{' '}
								</Fragment>
							) }
						</Placeholder>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default withNotices( Edit );