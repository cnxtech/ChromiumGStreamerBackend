// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "extensions/browser/extension_util.h"

#include "content/public/browser/browser_context.h"
#include "content/public/browser/site_instance.h"
#include "extensions/browser/extension_prefs.h"
#include "extensions/browser/extension_registry.h"
#include "extensions/common/manifest_handlers/app_isolation_info.h"
#include "extensions/common/manifest_handlers/incognito_info.h"

namespace extensions {
namespace util {

bool HasIsolatedStorage(const ExtensionInfo& info) {
  if (!info.extension_manifest.get())
    return false;

  std::string error;
  scoped_refptr<const Extension> extension(Extension::Create(
      info.extension_path,
      info.extension_location,
      *info.extension_manifest,
      Extension::NO_FLAGS,
      info.extension_id,
      &error));

  return extension.get() &&
         AppIsolationInfo::HasIsolatedStorage(extension.get());
}

bool SiteHasIsolatedStorage(const GURL& extension_site_url,
                            content::BrowserContext* context) {
  const Extension* extension = ExtensionRegistry::Get(context)->
      enabled_extensions().GetExtensionOrAppByURL(extension_site_url);

  return extension && AppIsolationInfo::HasIsolatedStorage(extension);
}

bool CanBeIncognitoEnabled(const Extension* extension) {
  return IncognitoInfo::IsIncognitoAllowed(extension) &&
         (!extension->is_platform_app() ||
          extension->location() == Manifest::COMPONENT);
}

content::StoragePartition* GetStoragePartitionForExtensionId(
    const std::string& extension_id,
    content::BrowserContext* browser_context) {
  GURL site_url = content::SiteInstance::GetSiteForURL(
      browser_context, Extension::GetBaseURLFromExtensionId(extension_id));
  content::StoragePartition* storage_partition =
      content::BrowserContext::GetStoragePartitionForSite(browser_context,
                                                          site_url);
  return storage_partition;
}

}  // namespace util
}  // namespace extensions
